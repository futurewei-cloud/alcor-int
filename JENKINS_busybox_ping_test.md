# MIT License
```
Copyright(c) 2020 Futurewei Cloud
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files(the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

# Alcor Ping Test Setup
Running of automated Alcor builds and ping tests through jenkins can be performed by following these steps:
* For the Alcor ping tests, ideally we will require 3 machines. For our test case, an ubuntu VM is sufficient. Create and identify the 3 VMs. Lets call them host1, host2 and host3.

* host1 will be used for building and running the alcor services. It will also be the node which will access host2 and host3 to deploy the busybox containers on them and run a ping test between them. See the README.rd file of Alcor to learn about setting up of this host with necessary packages and configuration.

* host2 and host3 will the target nodes which will be running ACA service. One busybox container on each of these hosts will be installed and configured to use the goal state network configuration provided by Alcor services from host1. See the README.rd file of alcor-control-agent to learn about setting up of this host with necessary dependent packages and configuration.

# Installation of Jenkins
* The Jenkins requires following dependent packages:
1. openjdk-11-jdk
2. openjdk-11-jdk-headless
3. openjdk-11-jre
4. openjdk-11-jre-headless
Install the above packages using apt and proceed to next steps.

* Jenkins is a webservice that runs on the port 8080. Follow the setps below to get it installed:
1. wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
2. sudo sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
3. sudo apt update
4. sudo apt install jenkins

* Once we have the service installed, you can have it started by default at boot time by running:
```
sudo systemctl enable --now jenkins
```

* To check if the service is running or to start it, run:
1. sudo systemctl status jenkins
2. sudo systemctl start jenkins

* Once we have the Jenkins service running, you can open any browser on your local machine and go to the URL:
```
http://ip-address:8080/
```
* Here the IP is the public IP of your AWS VM. If you are on the same machine on which jenkins is intalled, you can access through localhost as well:
```
http://localhost:8080/
```

* When you visit the page for the first time, you will be asked to 'Unlock Jenkins' by entering the administrator password. The location of the password is also presented on the page. It is usually located at:
```
/var/lib/jenkins/scerets/initialAdminPassword
```
Go to the file and obtain the password and enter it here.

* Once through this page, you will be prensented with option to install some pluggins. Chose the default option and get the pluggins installed.

* After pluggins are installed, you will be asked to create a username and password for the jenkins page. Enter a name and password and other details asked for and proceed to next page.

* This completes the installation and running of jenkins service on host1. We can now can proceed with next steps of creating jobs to run builds or any automated tests.

#
Note
* Any job that you configure on jenkins server might need sudo perms. The jobs get run as user 'jenkins'. In order to prevent any permission related failures, give the user 'jenkins' sudo perms. See Misc section.

# Creation of Jobs on Jenkins
Follow the steps below:
1. Go to the jenkins home page and login with username and password created.
2. Select the 'New item' on the top left corner of the jenkins home page.
3. Fill in the field for item name with the descriptive name like 'busybox_ping_test'
4. Choose 'Freestyle project' option and click OK to save the job.

You will be taken to the configure page of the job that you just created. You do not have to provide details for each section. Few of the sections that you need to edit are:
1. Under the description box, provide a brief statement to describe the job. In our case, we can mention the that it is for running the busybox containers ping test through python test scripts in Alcor respository.

2. Choose the option 'Discard' old builds and enter a number for 'Days to keep builds' and 'Max # of builds to keep'. Usually 5 would be sufficient for each. You can also keep the builds for higher number of days, but ensure that server has sufficient space on its hard disk. The default jenkins build workspace is at /var/lib/jenkins/workspace. This is where all the builds and job files are located.

3. Under the section 'Source code management', select 'Git'. In the repository URL, provide the path to Alcor repository:
```
https://github.com/futurewei-alcor/alcor.git
```
You can choose your own forked repository too.
For branch specifier select
```
*/master
```
You can choose any private branch of yours as well.

4. The 'Build Triggers' option lets you choose how often you would like the build to run and under what conditions. For running it on a periodic basis, select the option 'Build periodically' and schedule a time and day to run the job. The syntax is similar to cron job syntax. A help section comes up when you click on the question mark symbol on the right corner of the field.

5. Under the Build section chose option to execute shell. Add the following lines in the text field:
```
cd scripts/busybox_ping_test
sudo ./ping_test.py
```

It essentially tells jenkins to go to its workspace on the jenkins server, clone a copy of the repository and run the above commands. Similary we can create any new job to run any particular build or test script. 

6. Save the page.


Running the jobs:
1. Once you are on the dashboard, you will be able to see the list of jenkins jobs you have created. Select your job and you will be taken to your job page. 

2. Once on the job page, the left hand column will show many options, one of them would be 'Build Now'. Select it and it will immediately start the job.

3. The newly triggered job will appear under the 'build history' section near the bottom left side of the page. Click on the progressing job to go to the job's page. You can now see a 'Console Output' option in the left column. Clicking here will take you to a page where you can see the command line output of the job. The page keeps flushing out the output until the job is over.

4. At the end a successful job will show up in the history with a blue icon and failure with a red icon. 

# Sending periodic emails
* Jenkins can be configured to send email reports of any jobs being run. In order to configure that follow the steps below:
1. Ensure that Jenkins has email notification pluggin installed. It usually gets installed by default. If not, get that installed.
2. From jenkins home page, go to Manage Jenkins and click on configure system.
3. Look for 'Extended Email Notification' section, fill in the fields for 'SMTP server' and 'SMTP port'. Click on the 'Advanced' option to view the fields of 'SMTP Username' and 'SMTP Password'. Fill in the fields with username and password. In our case of Alcor ping tests, we have made use of a gmail account. The SMTP server and ports used are smtp.gmail.com and 465. The username used is fw.cloud.networking@gmail.com. 
4. Select the checkbox 'Use SSL'
5. There is an optional field to fill default recipients where you can add a comma separated list of email IDs where you want to send emails.
6. Save the page

* Now you can go to the individual jobs dashboard and configure when to send emails:
1. Go to the job's configure section. Near the bottom of page click on 'Add post-build action' and choose 'E-mail notification'.
2. In the recipients field, add a list of comma separated list of users.
3. Select 'Send e-mail for every unstable build'
4. Again click on 'Add post-build action' and select 'Editable Email Notification
5. Leave all of the fields with their default values and select 'Advanced' option to view 'Triggers' section.
6. Click on 'Add Trigger' and select an option for which you want email to be sent. Select 'Always' for getting emails for every job being run.
7. In the 'Send To' option choose 'Recipient List'.
8. Save the page.


# Miscellaneous
1. The jenkins workspace is by default located at /var/lib/jenkins/.
Any job that we run from jenkins should keep into account the permissions needed to run commands at this location. For example, if your script creates any new files locally using a different account credentials (like 'ubuntu') then that user should have permissions to do so at this location.
In other case if the script is reaching out to files in different parts of filesystem, then ensure that user 'jenkins' as permissions to do so.
A usual work around for this issue is to run the job scripts as sudo.

2. Give user 'ubuntu' and 'jenkins' a sudo permissions by keeping them in sudo group. Edit the file file /etc/group and add the users to sudo group as shown below:
```
sudo:x:27:ubuntu,jenkins
```

3. Since the ping test makes use of user 'ubuntu', ensure that ubuntu is part of docker group. Edit the file /etc/group to include:
```
docker:x:<id>:ubuntu
```

4. Edit the file /etc/sudoers to uncomment the line. This is required by ping test as it connects to target hosts without a tty session to perform tasks.
```
Defaults  !requiretty
```

5. The user jenkins also needs password less access to the target nodes. Since user 'ubuntu' is already provided password less access, copy the .ssh folder of 'ubuntu' and place it in the jenkins home page:
```
cp -pr /home/ubuntu/.ssh /var/lib/jenkins
chown -R jenkins:jenkins /var/lib/jenkins/.ssh
```

5. While running jenkins job periodically, ensure the time zones matches your location. By default Jenkins uses UTC time zone. You can change it to PST by adding following option in the configuration:
```
TZ=Americas/Los_Angeles
```
Jenkins by default makes use of the environment variables of the host on which it is running. To view all environment options go to:
```
http://<IP>:8080/env-vars.html/
```

