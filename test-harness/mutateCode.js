const esprima = require('esprima');
const escodegen = require('escodegen');
const options = { tokens: true, tolerant: true, loc: true, range: true };
const fs = require('fs');
const chalk = require('chalk');
const { ReturnStatement } = require('esprima');

let operations = [
    ConditionalBoundary,
    Incremental,
    NegateConditionals,
    CloneReturn,
    ConditionalExpression,
    ConstantReplacement,
    NonEmptyString,
    ControlFlow
];

let opNames = [
    'ConditionalBoundary',
    'Incremental',
    'NegateConditionals',
    'CloneReturn',
    'ConditionalExpression',
    'ConstantReplacement',
    'NonEmptyString',
    'ControlFlow'
];

let log;

function mutateCode(filepath) {
    var buf = fs.readFileSync(filepath, 'utf8');
    try {
        var ast = esprima.parse(buf, options);
    } catch (e) {
        console.log(chalk.red(`Error parsing file ${filepath}`));
        console.log(e);
        return {
            mutationOperator: 'No operator applied, error parsing file.'
        };
    }
    let mutationDelegate = getRandomInt(operations.length);
    let op = operations[mutationDelegate];
    op(ast);
    let code = escodegen.generate(ast);
    fs.writeFileSync(filepath, code);
    return {
        mutationOperator: opNames[mutationDelegate],
        log: log
    };
}

// Conditional boundary mutations: > to >=, < to <=
function ConditionalBoundary(ast) {
    let candidates = 0;
    traverseWithParents(ast, node => {
        if (node.type === 'BinaryExpression' && node.operator === '>') {
            candidates++;
        } else if (node.type === 'BinaryExpression' && node.operator === '<') {
            candidates++;
        }
    });

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, node => {
        if (
            (node.type === 'BinaryExpression' && node.operator === '>') ||
            node.operator === '<'
        ) {
            // When the mutateTarget operator is a >, flip it
            if (current === mutateTarget && node.operator === '>') {
                node.operator = '>=';
                log = `Replacing > with >= on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );

                // When the mutateTarget operator is a ==, flip it
            } else if (current === mutateTarget && node.operator === '<') {
                node.operator = '<=';
                log = `Replacing < with <= on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );
            }
            current++;
        }
    });
}

// Incremental mutations: ++j to j++, i++ to i--
function Incremental(ast) {
    let candidates = 0;
    traverseWithParents(ast, node => {
        if (
            node.type === 'UpdateExpression' &&
            (node.operator === '++' || node.operator === '--')
        ) {
            candidates++;
        }
    });

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, node => {
        if (node.type === 'UpdateExpression') {
            if (current === mutateTarget) {
                let prefix = getRandomInt(2);

                // Switching pre/post increment/decrement
                if (
                    prefix &&
                    (node.operator === '++' || node.operator === '--')
                ) {
                    node.prefix = !node.prefix;
                    if (node.prefix) {
                        log = `Replacing post-update with pre-update on line ${node.loc.start.line}`;
                        console.log(
                            chalk.red(
                                log
                            )
                        );
                    } else {
                        log = `Replacing pre-update with post-update on line ${node.loc.start.line}`;
                        console.log(
                            chalk.red(
                                log
                            )
                        );
                    }
                }

                // When the mutateTarget operator is a >, flip it
                else if (!prefix && node.operator === '++') {
                    node.operator = '--';
                    log = `Replacing ++ with -- on line ${node.loc.start.line}`;
                    console.log(
                        chalk.red(
                            log
                        )
                    );

                    // When the mutateTarget operator is a ==, flip it
                } else if (!prefix && node.operator === '--') {
                    node.operator = '++';
                    log = `Replacing -- with ++ on line ${node.loc.start.line}`;
                    console.log(
                        chalk.red(
                            log
                        )
                    );
                }
            }
            current++;
        }
    });
}

// Negate conditionals: == to !=, > to <
function NegateConditionals(ast) {
    let candidates = 0;
    traverseWithParents(ast, node => {
        if (node.type === 'BinaryExpression' && node.operator === '>') {
            candidates++;
        } else if (node.type === 'BinaryExpression' && node.operator === '==') {
            candidates++;
        }
    });

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, node => {
        if (
            node.type === 'BinaryExpression' &&
            (node.operator === '>' || node.operator === '==')
        ) {
            // When the mutateTarget operator is a >, flip it
            if (current === mutateTarget && node.operator === '>') {
                node.operator = '<';
                log = `Replacing > with < on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );

                // When the mutateTarget operator is a <, flip it
            } else if (current === mutateTarget && node.operator === '<') {
                node.operator = '>';
                log = `Replacing < with > on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );

                // When the mutateTarget operator is a !=, flip it
            } else if (current === mutateTarget && node.operator === '!=') {
                node.operator = '==';
                log = `Replacing !== with == on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );

                // When the mutateTarget operator is a ==, flip it
            } else if (current === mutateTarget && node.operator === '==') {
                node.operator = '!=';
                log = `Replacing == with != on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );
            }

            current++;
        }
    });
}

// Clone return, early Find: return embeddedHtml;
function CloneReturn(ast) {
    let candidates = 0;
    traverseWithParents(ast, node => {
        if (node.type == 'FunctionDeclaration') {
            for (let i = 1; i < node.body.body.length; i++) {
                if (node.body.body[i].type == 'ReturnStatement') {
                    candidates++;
                }
            }
        }
    });

    let mutateTarget = getRandomInt(candidates);
    let randomizer = 0;
    let current = 0;
    traverseWithParents(ast, node => {
        if (node.type == 'FunctionDeclaration') {
            for (let i = 1; i < node.body.body.length; i++) {
                if (
                    current === mutateTarget &&
                    node.body.body[i].type == 'ReturnStatement'
                ) {
                    randomizer = getRandomInt(i);
                    node.body.body.splice(randomizer, 0, node.body.body[i]);
                    log = `Cloning return statement earlier on line ${node.loc.start.line}`
                    console.log(chalk.red(log));
                    break;
                }
            }
            current++;
        }
    });
}

// Conditional expression mutation: && to ||, || to &&
function ConditionalExpression(ast) {
    let candidates = 0;
    traverseWithParents(ast, node => {
        if (
            (node.type === 'LogicalExpression' && node.operator === '&&') ||
            node.operator === '||'
        ) {
            candidates++;
        }
    });

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, node => {
        if (
            (node.type === 'LogicalExpression' && node.operator === '&&') ||
            node.operator === '||'
        ) {
            // When the mutateTarget operator is a &&, flip it
            if (current === mutateTarget && node.operator === '&&') {
                node.operator = '||';
                log = `Replacing && with || on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );

                // When the mutateTarget operator is a ==, flip it
            } else if (current === mutateTarget && node.operator === '||') {
                node.operator = '&&';
                log = `Replacing || with && on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );
            }
            current++;
        }
    });
}

// Clone return, early Find: return embeddedHtml;
function ConstantReplacement(ast) {
    let candidates = 0;
    traverseWithParents(ast, node => {
        if (node.type === 'Literal' && Number.isInteger(node.value)) {
            candidates++;
        }
    });

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    let previousNum = 0;
    let randomNum = getRandomInt(100);
    traverseWithParents(ast, node => {
        if (node.type === 'Literal' && Number.isInteger(node.value)) {
            // When the mutateTarget is a number, change it to a random number
            if (current === mutateTarget) {
                previousNum = node.value;
                node.value = randomNum;
                log = `Replacing ${previousNum} with ${randomNum} on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );
            }

            current++;
        }
    });
}

// Mutate control flow: 'if' to 'else if', 'else if' to 'if'
function ControlFlow(ast) {
    let candidates = 0;
    traverseWithParents(ast, node => {
        if (node.type === 'IfStatement') {
            let nodeKeys = Object.keys(node.parent);

            if (!nodeKeys.includes('alternate')) {
                let index = node.parent.indexOf(node);

                if (
                    index !== 0 &&
                    node.parent[index - 1].type === 'IfStatement'
                ) {
                    candidates++;
                }
            } else {
                candidates++;
            }
        }
    });

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, node => {
        if (node.type === 'IfStatement') {
            // When the mutateTarget is a number, change it to a random number
            let nodeKeys = Object.keys(node.parent);

            if (!nodeKeys.includes('alternate')) {
                let index = node.parent.indexOf(node);

                if (
                    index !== 0 &&
                    node.parent[index - 1].type === 'IfStatement'
                ) {
                    if (current === mutateTarget) {
                        let recNode = node.parent[index - 1];
                        while (recNode.alternate != null) {
                            recNode = recNode.alternate;
                        }

                        recNode.alternate = node;
                        node.parent.splice(index, 1);
                        
                        log = `Replacing 'if' with 'else if' on line ${node.loc.start.line}`;
                        console.log(
                            chalk.red(
                                log
                            )
                        );
                    }
                    current++;
                }
            } else {
                if (current === mutateTarget) {
                    let nodePrev = node;
                    let nodeParent = node.parent;
                    nodeKeys = Object.keys(nodePrev.parent);

                    while (nodeKeys.includes('alternate')) {
                        nodePrev = nodePrev.parent;
                        nodeKeys = Object.keys(nodePrev.parent);
                    }

                    let index = nodePrev.parent.indexOf(nodePrev);
                    nodePrev.parent.splice(index + 1, 0, node);
                    nodeParent.alternate = null;

                    log = `Replacing 'else if' with 'if' on line ${node.loc.start.line}`;
                    console.log(
                        chalk.red(
                            log
                        )
                    );
                }
                current++;
            }
        }
    });
}

// Non-empty string: "" to "<div>Bug</div>"
function NonEmptyString(ast) {
    let candidates = 0;
    traverseWithParents(ast, node => {
        if (
            node.type === 'Literal' &&
            (typeof node.value === 'string' || node.value instanceof String) &&
            node.value === ''
        ) {
            candidates++;
        }
    });

    let mutateTarget = getRandomInt(candidates);
    var things = ['paper', 'rock', 'scissors', 'icecream', 'im_a_bug'];
    let str = things[getRandomInt(things.length)];
    let current = 0;
    traverseWithParents(ast, node => {
        if (
            node.type === 'Literal' &&
            (typeof node.value === 'string' || node.value instanceof String) &&
            node.value === ''
        ) {
            // When the mutateTarget is a number, change it to a random number
            if (current === mutateTarget) {
                node.value = str;
                log = `Replacing empty string with ${str} on line ${node.loc.start.line}`;
                console.log(
                    chalk.red(
                        log
                    )
                );
            }

            current++;
        }
    });
}
// Helper function for getting random location to mutate
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor) {
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (
                typeof child === 'object' &&
                child !== null &&
                key != 'parent'
            ) {
                child.parent = object;
                traverseWithParents(child, visitor);
            }
        }
    }
}

// Helper function for counting children of node.
function childrenLength(node) {
    var key, child;
    var count = 0;
    for (key in node) {
        if (node.hasOwnProperty(key)) {
            child = node[key];
            if (
                typeof child === 'object' &&
                child !== null &&
                key != 'parent'
            ) {
                count++;
            }
        }
    }
    return count;
}

// Helper function for checking if a node is a "decision type node"
function isDecision(node) {
    if (
        node.type == 'IfStatement' ||
        node.type == 'ForStatement' ||
        node.type == 'WhileStatement' ||
        node.type == 'ForInStatement' ||
        node.type == 'DoWhileStatement'
    ) {
        return true;
    }
    return false;
}

// Helper function for printing out function name.
function functionName(node) {
    if (node.id) {
        return node.id.name;
    }
    return 'anon function @' + node.loc.start.line;
}

module.exports = { mutateCode };
