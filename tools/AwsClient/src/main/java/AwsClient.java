package main.java;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

class Host {
    String id;
    String ip;
    String mac;
    String veth;

    Host(String strName, String strIp, String strMac) {
        id = strName;
        ip = strIp;
        mac = strMac;
        veth = "{}";
    }

    Host(String strName, String strIp, String strMac, String strVeth) {
        id = strName;
        ip = strIp;
        mac = strMac;
        veth = strVeth;
    }

    public void setId(String strId) {
        id = strId;
    }
}

class Machines {
    ArrayList<Host> Hosts = new ArrayList<Host>();

    Machines() {
        Hosts = new ArrayList<Host>();
    }

    public void add(Host host, Integer number) {
        if (Hosts == null)
            Hosts = new ArrayList<Host>();
        if (host != null) {
            String strId = "ephost_";
            strId = strId + number.toString();
            host.setId(strId);
            Hosts.add(host);
        }
    }
}

public class AwsClient {

    Machines machines = new Machines();

    public AwsClient() {
        machines = new Machines();
    }

    public static void main(String[] args) {
        AwsClient awsClient = new AwsClient();
        awsClient.getInstancesInfo();
        awsClient.makeJsonFile();
    }

    public void getInstancesInfo() {
        Ec2Client ec2 = Ec2Client.create();
        boolean done = false;

        String nextToken = null;
        do {
            DescribeInstancesRequest request = DescribeInstancesRequest.builder().nextToken(nextToken).build();
            DescribeInstancesResponse response = ec2.describeInstances(request);

            int number = 0;
            for (Reservation reservation : response.reservations()) {
                for (Instance instance : reservation.instances()) {
                    IamInstanceProfile iamInstanceProfile = instance.iamInstanceProfile();
                    String strArn = instance.iamInstanceProfile().arn();
                    int ndx = strArn.indexOf("/");
                    if (ndx >= 0 && strArn.length() > ndx + 1) {
                        String strNodeName = strArn.substring(ndx + 1);
                        if (strNodeName.startsWith("nodes")) {
                            List<InstanceNetworkInterface> inw = instance.networkInterfaces();
                            for (InstanceNetworkInterface i : inw) {
                                if (i.attachment().deviceIndex() == 0) {
                                    String strIp = i.privateIpAddress();
                                    String strMac = i.macAddress();
                                    machines.add(new Host(strNodeName, strIp, strMac), new Integer(number));
                                    number++;
                                }
                            }
                        }
                    }
                }
            }
            nextToken = response.nextToken();
        } while (nextToken != null);
    }

    public void makeJsonFile() {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String machineJson = gson.toJson(gson.toJsonTree(machines));

        try {
            File file = new File("machine.json");
            if (!file.exists()) {
                file.createNewFile();
            }

            FileWriter fw = new FileWriter(file, true);
            BufferedWriter bw = new BufferedWriter(fw);
            bw.write(machineJson);
            bw.close();
            System.out.println("machine.json file is created.");
        } catch (IOException ioe) {
            ioe.printStackTrace();
        }
    }

}
