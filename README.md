# 💎 F0-tkwu README

## 💻 **How to run**

---

### **Prerequisites** 🎛️  

#### **Software**  

This program is built on [VirtualBox](https://www.virtualbox.org/) which can be installed [here](https://www.virtualbox.org/wiki/Downloads).  
*Note:* The newest version of VirtualBox may not work with the pipeline. 

#### **Required Dependencies**  

```bash
# Install bakerx package if not already there
$ npm install -g ottomatica/bakerx

# Ensure bakerx is installed
$ bakerx --version
bakerx@0.9.0
```

#### **Pull the Ubuntu focal image for `bakerx`**

Our design is only be run Intel-based computers... Sorry M1 😔

```bash
bakerx pull focal cloud-images.ubuntu.com 
```

--- 

**Note:** An `.env` file is not used for F0 job.

---

## **New Feature:** Dashboard Monitor 💨  

The new feature builds on top of the previous `pipeline deploy ...` stage with `pipeline monitor-deploy ...`, which does the same thing as before (performs blue/green deployment strategy from M3). This is integrated from the [Monitor workshop](https://github.com/CSC-DevOps/Monitoring), which creates a dashboard that monitors the CPU usage, memory, latency, HTTP status health, and time-trend score, for the `web-srv` instance (which hosts the proxy server) and the `blue` & `green` instances (which hosts the web application). The addition of the Dashboard works with the blue/green deployment strategy to illustrate the health status of the `web-srv`'s monitor of the `blue` & `green` servers.  

---

## **Open Source Project 1: 7ep demo** 📂  

https://github.com/7ep/demo  

### **How to Run 7ep demo Pipeline.** 🐧

**Note:** If at anytime the pipeline fails, please re-run the job or completely re-start the pipeline over. Measure have been taken to counteract these flaky errors using retries and delays, however, the overall issue unfortunately out of my hands. Common errors you may encounter include, `dpkg lock` error, corrupt package installation errors (`ansible`), or `bakerx` errors in general. The best and only option (if the retries also fail) is to re-running the command.  

#### **Initial Setup**  
```bash
# Install npm packages
$ npm install

# Provision and configure computing environment for pipeline (creates the VMs config-srv and web-srv, fills inventory file)
$ node index.js init
```

#### **Build Job**  
```bash
# Trigger a build job, running steps outlined by build.yml, wait for output, and print build log.
$ node index.js build build-7ep_demo <relative_absolute-filepath>/build.yml
or
$ node index.js build build-7ep_demo ./ansible/build.yml    # Example
```

#### **Test Job**  

**Note:** The web application relies on a `jcenter` dependency, which the URL used to obtain the dependency may be unavailable the time of executing (this happened 2 times during my screencast). This causes the `test` job and `monitor-deploy` job to hang, and the only option is to run it at a different time when the URL is available. Although this issue is also out of my hands, this occurrence is usually uncommon.  

```bash
# Trigger a test job which executes the API web/system tests, running steps outlined by build.yml, wait for output, and print test log.
$ node index.js build test-7ep_demo <relative_absolute-filepath>/build.yml
or
$ node index.js build test-7ep_demo ./ansible/build.yml    # Example
```

#### **Deploy Job + New Feature: Dashboard Monitor** ⚗️   
```bash
# Provision green/blue instances and generate inventory file
$ node index.js prod up

# Trigger a deployment, running steps outlined by build.yml, wait for output, print log, and determine success or failure.
$ node index.js monitor-deploy <relative_absolute-filepath>/inventory deploy-7ep_demo <relative_absolute-filepath>/build.yml
or 
$ node index.js monitor-deploy ./deployment/inventory deploy-7ep_demo ./ansible/build.yml    # Example
```

*Note:* The endpoint uses `/demo` to access the web application.  

---

## 📹 **Screencast: 7ep demo**  

[LINK TO SCREENCAST HERE](https://drive.google.com/file/d/1XuUXjaQyxVNeWCNFjW_jGbM9rhsIkKT1/view?usp=sharing)

<br/>

---

---

## **Open Source Project 2: tighten confomo** 📂  

https://github.com/tighten/confomo  

### **How to Run tighten confomo Pipeline.** 🐧

**Note:** If at anytime the pipeline fails, please re-run the job or completely re-start the pipeline over. Measure have been taken to counteract these flaky errors using retries and delays, however, the overall issue unfortunately out of my hands. Common errors you may encounter include, `dpkg lock` error, corrupt package installation errors (`ansible`), or `bakerx` errors in general. The best and only option (if the retries also fail) is to re-running the command.  

#### **Initial Setup**  
```bash
# Install npm packages
$ npm install

# Provision and configure computing environment for pipeline (creates the VMs config-srv and web-srv, fills inventory file)
$ node index.js init
```

#### **Build Job**  
```bash
# Trigger a build job, running steps outlined by build.yml, wait for output, and print build log.
$ node index.js build build-tighten_confomo <relative_absolute-filepath>/build.yml
or
$ node index.js build build-tighten_confomo ./ansible/build.yml    # Example
```

#### **Test Job**  
```bash
# Trigger a test job which executes the API web/system tests, running steps outlined by build.yml, wait for output, and print test log.
$ node index.js build test-tighten_confomo <relative_absolute-filepath>/build.yml
or
$ node index.js build test-tighten_confomo ./ansible/build.yml    # Example
```

#### **Deploy Job + New Feature: Dashboard Monitor** ⚗️   
```bash
# Provision green/blue instances and generate inventory file
$ node index.js prod up

# Trigger a deployment, running steps outlined by build.yml, wait for output, print log, and determine success or failure.
$ node index.js monitor-deploy <relative_absolute-filepath>/inventory deploy-tighten_confomo <relative_absolute-filepath>/build.yml
or 
$ node index.js monitor-deploy ./deployment/inventory deploy-tighten_confomo ./ansible/build.yml    # Example
```

*Note:* No endpoint is used to access the web application.  

---

## 📹 **Screencast: tighten confomo**  

[LINK TO SCREENCAST HERE](https://drive.google.com/file/d/1M5hGp36vWiYhn93K7rboxGIpLqMV5Dcj/view?usp=sharing)

<br/>

---

## 📋 **F0 Report**  

For `F0`, the open source projects that I have chosen are [7ep demo](https://github.com/7ep/demo) and [tighten confomo](https://github.com/tighten/confomo), both of which had different challenges and issues that had to overcome. 

As for [7ep demo](https://github.com/7ep/demo), building the stack was relatively simple because there was already a command that set all the stacks of the web application. However, there was more installations and setups involved when executing the web tests of the project. As opposed to simple tests of the build stage of the pipeline, the test stage requires `google chrome` with the `chromedriver`  to execute the API and UI tests. Additionally, the application has to be running for the API and UI tests to fully execute and pass. Using `nohup` and `setsid` didn't work since the web app ended right after it's execution, however, using `screen` in detached mode worked perfectly with the `asynchronous` option from the `shell` module. By spawning and executing the web app in the new terminal, I was able to run and pass the API and UI tests. Right after the tests finished, I ended the web app using `pkill -9 -f tomcat` to end the tomcat server.  

In the [tighten confomo](https://github.com/tighten/confomo) pipeline, the setting up and building the application was a lot harder compared to the first project because there was not script/command that handled the setup. Building the web app involved installing various components of `phpv7.4`, which was confusing at first because some components were not available on `apt` and could only be installed with `apt-get` (`php7.4-sqlite`). Another issue was having to go through the installation process of `composer`, which involved downloaded and verifying the setup script before installing it. There were other time consuming blockers that I encountered along the way, such as having to set `root` user permissions for the cloned repository and having extracting the current IP of the instance, but overall the experience was very valuable in applying my DevOps knowledge towards open sources projects. 

There were flaky errors that I encountered, them being package installation fails, `bakerx` errors, and project dependency that access URL's that are down. All of these errors were unfortunately out of my hand, and the only fix is to re-run the command or start completely over. It was a bit frustrating because these issues not something I could fix, however moving past that, everything else went as mentioned above.  

For the new feature, I decided to extend the `pipeline deploy ...` stage to include a dashboard that monitors various statistics, such as CPU usage, memory, latency, HTTP health status, and time-trend score. These statistics were gathered from the `web-srv` instance which holds the proxy that directs the traffic towards the `blue-green` servers, and the `blue` and `green` instances from M3's blue/green deployment strategy. Since M3 was generalized to extract the IP, port, and endpoint from the `build.yml` parameters, getting the dashboard to connect to the `web-srv`, `blue`, and `green` servers didn't take as much time as I thought. The most time consuming aspect was trying to having `pipeline monitor-deploy ...` run through the necessary setups on top of the existing infrastructure to connect deployment to the dashboard script. The additional setup uses `forever` to run the dashboard script, and the existing proxy script was modified to also use `forever` since it was cleaner than having the terminal continuously print the health status. Overall, this project was very challenging and rewarding!

---
