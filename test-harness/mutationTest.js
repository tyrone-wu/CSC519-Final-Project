const puppeteer = require('puppeteer');
const spawn = require('child_process').spawn;
var kill  = require('tree-kill');
const exec = require('child_process').exec;
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const mutateCode = require('./mutateCode').mutateCode;

/** The directory to save snapshot PNGs to */
const testDir = '/bakerx/test-screenshots';
/** The directory to save non-mutated snapshot PNGs to */
const originalDir = `${testDir}/original`;
/** The directory to save mutated snapshot PNGs to */
const mutatedDir = `${testDir}/mutated`;

/**
 * Apply a mutation to the sourcefile
 * @param {*} filepath path to the unmodified sourcefile
 * @param {*} newPath path to the mutated sourcefile
 * @returns an object containing the mutation operator applied and the source line which was changed.
 */
const applyMutation = async (filepath) => {
    // Call the mutateCode() function to apply the mutation
    const { mutationOperator, log } = mutateCode(filepath);
    return {
        mutationOperator: mutationOperator,
        log: log
    };
};

/**
 * Generates a set of snapshots for the specified URLs
 * @param {*} browser the puppeteer browser instance
 * @param {*} urls the URLs to generate snapshots for
 * @param {*} dir the directory to save the snapshots to
 * @param {*} extension the extension to use for the snapshots
 * @returns a map of URL to snapshot filename
 */
const getSnapshots = async (urls, dir, extension) => {
    // Create a map of URL to snapshot filename
    const snapshots = new Map();
    // Iterate over the URLs
    for (let url of urls) {
        // Create a filename for the snapshot using the URL
        // Replace any non-alphanumeric characters with an underscore
        const filename = `${dir}/${url.replace(
            /[^a-z0-9]/gi,
            '_'
        )}_${extension}.png`;
        // Launch the browser
        const browser = await launchBrowser();
        // Navigate to the page
        let page = await browser.newPage();
        try {
            await page.goto(url); //, { waitUntil: 'domcontentloaded' }
            // await page.waitForFunction('window.ready');
        } catch (e) {
            console.log(chalk.red("Couldn't load page: " + url));
            console.log(e);
        }
        // Take screenshot and save as filename
        await page.screenshot({
            path: filename
        });
        // Add url and error
        snapshots.set(url, filename);
        // Close the page
        await page.close();
        // Close the browser
        await browser.close();
    }
    // Return the map of URL to snapshot filename
    return snapshots;
};

/**
 * Launches a browser instance
 * @returns a puppeteer browser instance
 */
const launchBrowser = async () => {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--window-size=1920,1080',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
};

/**
 * Compares original and mutated snapshots.
 * @param {*} orignalFilename filename of the original snapshot
 * @param {*} mutatedFilename filename of the mutated snapshot
 * @returns true if the snapshots are the same, false otherwise
 */
const compareSnapshots = async (orignalFilename, mutatedFilename) => {
    let diff;
    let original;
    let mutated;
    // Read the original and mutated files
    await new Promise(resolve => {
        original = fs
            .createReadStream(orignalFilename)
            .pipe(new PNG())
            .on('parsed', () => {
                mutated = fs
                    .createReadStream(mutatedFilename)
                    .pipe(new PNG())
                    .on('parsed', () => {
                        resolve();
                    });
            });
    });

    // Create a new canvas to draw the diff on
    const diffImage = new PNG({
        width: original.width,
        height: original.height
    });

    // Compare the images
    diff = await pixelmatch(
        original.data,
        mutated.data,
        diffImage.data,
        original.width,
        original.height,
        { threshold: 0.1 }
    );

    // Return whether the images are the same
    console.log(diff);
    return diff === 0;
};

(async () => {
    // Output testing starting
    console.log('----------------------------------------');
    console.log('Starting Mutation Testing...');
    console.log('----------------------------------------');

    // Parse arguments
    const iterations = JSON.parse(
        fs.readFileSync('/bakerx/test-harness/vars/track-iters.json')
    );

    const sourceFileDir = '/bakerx/mutation-repository';
    const sourceFilename = 'index.js';
    const fileToMutateDir = '/bakerx/mutation-repository';
    const fileToMutate = 'marqdown.js';

    const filesToMutate = JSON.parse(
        fs.readFileSync('/bakerx/test-harness/vars/source-files.json')
    );

    const urls = JSON.parse(
        fs.readFileSync('/bakerx/test-harness/vars/snapshot-urls.json')
    );

    // Create directories to hold the original and mutated snapshots
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    if (!fs.existsSync(originalDir)) fs.mkdirSync(originalDir);
    if (!fs.existsSync(mutatedDir)) fs.mkdirSync(mutatedDir);

    // Record mutations that failed
    fs.openSync(`${testDir}/failure-logger.txt`, 'w');
    let failureLog = fs.createWriteStream(`${testDir}/failure-logger.txt`, {
        flags: 'a'
    });

    // Variables for service and mutated service
    let service, mutatedService;

    process.on('exit', () => {
        if (service) kill(service.pid);
        if (mutatedService) kill(mutatedService.pid);
    });

    // Start the service with the un-mutated code
    service = await spawn('sudo', ['node', `${sourceFilename}`], {
        cwd: sourceFileDir
    });
    await new Promise(r => setTimeout(r, 500));

    // Generate initial snapshots
    const initialSnapshots = await getSnapshots(urls, originalDir, 'original');

    // Stop the service
    await kill(service.pid);
 
    // Create variable to store failures
    let failures = 0;

    // Copy original file to different name, to restore after each mutation
    // fs.copyFile(
    //     `${fileToMutateDir}/${fileToMutate}`,
    //     `${fileToMutateDir}/original-${fileToMutate}`,
    //     fs.constants.COPYFILE_FICLONE,
    //     err => {}
    // );
    for (let i = 0; i < filesToMutate.length; i++) {
        let file = filesToMutate[i].file;
        let dir = filesToMutate[i].path;
        fs.copyFile(
            path.join(fileToMutateDir, dir, file),
            path.join(fileToMutateDir, dir, `original-${file}`),
            fs.constants.COPYFILE_FICLONE,
            err => {}
        );
    }

    // Run mutation testing for the specified number of iterations
    for (var i = 0; i < iterations; i++) {
        // Count failures for this iteration
        let currentFailures = 0;

        // Apply a mutation to the code
        // const { mutationOperator, log } = await applyMutation(
        //     `${fileToMutateDir}/${fileToMutate}`
        // );
        let fileDir = filesToMutate[Math.floor(Math.random() * filesToMutate.length)];
        const { mutationOperator, log } = await applyMutation(
            path.join(fileToMutateDir, fileDir.path, fileDir.file)
        );

        // Start the service with the mutated code
        mutatedService = await spawn('sudo', ['node', `${sourceFilename}`],  {
            cwd: sourceFileDir
        });
        await new Promise(r => setTimeout(r, 500));

        // Generate snapshots for the mutated code
        const mutatedSnapshots = await getSnapshots(
            urls,
            mutatedDir,
            `muatation-${i}`
        );

        // Stop the service
        await kill(mutatedService.pid);

        // Restore original file for next iteration
        // fs.copyFileSync(
        //     `${fileToMutateDir}/original-${fileToMutate}`,
        //     `${fileToMutateDir}/${fileToMutate}`,
        //     fs.constants.COPYFILE_FICLONE,
        //     err => {}
        // );
        fs.copyFile(
            path.join(fileToMutateDir, fileDir.path, `original-${fileDir.file}`),
            path.join(fileToMutateDir, fileDir.path, fileDir.file),
            fs.constants.COPYFILE_FICLONE,
            err => {}
        );

        // Compare the snapshots
        let failFlag = false;
        for (let url of urls) {
            const originalFilename = initialSnapshots.get(url);
            const mutatedFilename = mutatedSnapshots.get(url);
            if (mutatedFilename === -1) {
                currentFailures++;
                failFlag = true;
            } else {
                const areEqual = await compareSnapshots(
                    originalFilename,
                    mutatedFilename
                );
                if (!areEqual) {
                    currentFailures++;
                    failFlag = true;
                }
            }
        }
        if (failFlag) {
            failures++;
        }

        // Output mutation result
        let mutationOutput = `Iteration: ${i}\nMutation Operator: ${mutationOperator}\nOperation: ${log}\nResult: ${currentFailures} of ${urls.length} failed\n`;
        console.log(mutationOutput);
        console.log('----------------------------------------\n');

        // Record failed mutation
        if (failFlag) {
            failureLog.write('----------------------------------------');
            failureLog.write(mutationOutput);
        }
    }

    // Output coverage report
    console.log(
        `Mutation Coverage: ${failures} Failures / ${iterations} Iterations`
    );
    console.log('----------------------------------------');
    failureLog.end();
})();
