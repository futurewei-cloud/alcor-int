# How to build ACA image and run it in docker/k8s

Use the bellow command to build image
```
docker build --no-cache -f Dockerfile -t aca_build .
```

After Build we can rename(tag) it, no need to do, unless upload to dockerhub:
```
docker tag <IMAGE ID> <username>/<aca_image_name>
```
To upload image to Dockerhub:
```
docker push <username>/<aca_image_name>
```

To download image to physical machines: 
```
docker pull <username>/<aca_image_name>
```

To run the docer image in container:
```
docker container run -d -it --cap-add=NET_ADMIN  --cap-add=SYS_PTRACE --privileged --security-opt seccomp=unconfined --name <aca_container_name> <username>/<aca_image_name> /bin/bash
```

To Login to the Docker container:
```
docker exec -u 0 -it <aca_container_name>  /bin/bash
```

___

## For k8s
To run the above aca image in K8s, we need to run the folling command on all k8s nodes.
```
docker pull <username>/<aca_image_name> 
```

Then we can use the bellow yaml file to create ACA pods in k8s:
```
Kubectl create -f aca_k8s.yaml
```

To get into ACA pod:
```
kubectl exec --stdin --tty <aca_pod_name> -- /bin/bash
```
