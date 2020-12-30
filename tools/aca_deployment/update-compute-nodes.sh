#!/bin/bash

#
# SCP aca_update.sh to each compute node
# and run aca_update.sh
#
function update_aca()
{
    local cmdfile=$1
    local ip=$2

    if [ ! -d ~/aca_logs ]; then
        mkdir -p ~/aca_logs
    fi

    echo "===== Copy $cmdfile to root@$ip:.  =====" 2>&1 | tee ~/aca_logs/$ip.log
    scp $cmdfile "root@$ip:." 2>&1 | tee -a ~/aca_logs/$ip.log
    echo "===== Run aca_update.sh on ssh root@$ip =====" 2>&1 | tee -a ~/aca_logs/$ip.log
    Y="./$cmdfile"
    ssh "root@$ip" "$Y" 2>&1 | tee -a ~/aca_logs/$ip.log
    echo "===== $ip update done! =====" 2>&1 | tee -a ~/aca_logs/$ip.log
}

# Test an IP address for validity:
# Usage:
#      valid_ip IP_ADDRESS
#      if [[ $? -eq 0 ]]; then echo good; else echo bad; fi
#   OR
#      if valid_ip IP_ADDRESS; then echo good; else echo bad; fi
#
function valid_ip()
{
    local  ip=$1
    local  stat=1

    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 \
            && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
        stat=$?
    fi
    return $stat
}

FILE=
if [[ $# -lt 2 ]]; then
        echo "Usage: update-compute-nodes <shell script file>  <compute nodes file>"
        exit 1
else
        CMDSFILE=$1
        COMPUTEFILE=$2
fi

if [ ! -f "$CMDSFILE" ]; then
        echo "*** $CMDSFILE does not exist!"
        exit 1
fi

if [ ! -f "$COMPUTEFILE" ]; then
        echo "*** $COMPUTEFILE does not exist!"
        exit 1
fi

while IFS= read -r line
do
        if valid_ip $line; then
                echo "*********** process $line *****************"
                update_aca $CMDSFILE $line &
        fi
done < "$COMPUTEFILE"

wait
echo "*********** ALL COMPUTE NODES UPDATE DONE!! *****************"

