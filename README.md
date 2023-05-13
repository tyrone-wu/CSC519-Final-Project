# 🤖 Automated Build, Deployment, and Monitoring Project

My CSC519 DevOps final project. Our `build.yml` was required to have the following structure:  
```yaml
setup:
  - <list-of-steps>
  - ...
  - <list-of-steps>

jobs:
  - name: <job-name>
    steps:
      - <list-of-steps>
      - ...
      - <list-of-steps>
```

## 💻 **How to run**

### **Prerequisites**

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

**Note:** An `.env` file is not used for F0 job.

---

## **New Feature:** Dashboard Monitor 💨  

The new feature builds on top of the previous `pipeline deploy ...` stage with `pipeline monitor-deploy ...`, which does the same thing as before (performs blue/green deployment strategy from M3). This is integrated from the [Monitor workshop](https://github.com/CSC-DevOps/Monitoring), which creates a dashboard that monitors the CPU usage, memory, latency, HTTP status health, and time-trend score, for the `web-srv` instance (which hosts the proxy server) and the `blue` & `green` instances (which hosts the web application). The addition of the Dashboard works with the blue/green deployment strategy to illustrate the health status of the `web-srv`'s monitor of the `blue` & `green` servers.  

---

## **Open Source Project 1: 7ep demo** 📂  

https://github.com/7ep/demo  

### **How to Run 7ep demo Pipeline.**

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

## **Open Source Project 2: tighten confomo** 📂  

https://github.com/tighten/confomo  

### **How to Run tighten confomo Pipeline.**

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
