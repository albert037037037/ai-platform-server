import k8s from '@kubernetes/client-node';
import mongoose from 'mongoose';
import crypto from 'crypto';
import logger from '../libs/logger';
import service from '../service';
import model from '../models';

const cluster = {
  name: 'kubernetes',
  server: 'https://140.114.91.156:6443',
  // caFile: '/usr/src/app/ssl/ca.crt',
  caFile: 'ssl/ca.crt',
  skipTLSVerify: false,
};

const user = {
  name: 'kubernetes-admin',
  certFile: 'ssl/apiserver-kubelet-client.crt',
  keyFile: 'ssl/apiserver-kubelet-client.key',
  // certFile: '/usr/src/app/ssl/client.crt',
  // keyFile: '/usr/src/app/ssl/client.key',
};

const context = {
  name: 'kubernetes-admin@kubernetes',
  user: 'kubernetes-admin',
  cluster: 'kubernetes',
};

const kc = new k8s.KubeConfig();
kc.loadFromOptions({
  clusters: [cluster],
  users: [user],
  contexts: [context],
  currentContext: context.name,
});

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

const k8sSession = {
  async UserLogIn(username, replicas) {
    const Lowerusername = username.toLowerCase();
    const userNamespaceName = `${Lowerusername}-ai-platform`;
    const res = await k8sAppsApi.readNamespacedStatefulSet('jupyter-notebook', userNamespaceName);
    const state = res.body;
    // Get all files this user can access and mount it on jupyter
    const fileCanAccess = await service.access.getHasPermission(username);
    logger.info(`file can access: ${JSON.stringify(fileCanAccess)}`);
    state.spec.template.spec.containers[0].volumeMounts = [{
      mountPath: '/home/jovyan',
      name: 'jupyter-notebook-volume',
    }];
    state.spec.template.spec.volumes = [{
      name: 'jupyter-notebook-volume',
      persistentVolumeClaim: {
        claimName: 'jupyter-notebook-pvc',
      },
    }];
    let num = 0;
    const fileCanAccessProcess = fileCanAccess.map(async (fileId) => {
      const subPath = await model.file.findOne({ _id: mongoose.Types.ObjectId(fileId.file_id) }, '-_id subPath');
      const newVolumeMount = {
        mountPath: `/home/jovyan/_share/${subPath.subPath}`,
        name: `go-uploader-volume-${num}`,
        subPath: `${subPath.subPath}`,
        readOnly: true,
      };
      const newVolume = {
        name: `go-uploader-volume-${num}`,
        nfs: {
          path: '/var/k8s/_share',
          server: '10.121.240.237',
        },
      };
      state.spec.template.spec.containers[0].volumeMounts.push(newVolumeMount);
      state.spec.template.spec.volumes.push(newVolume);
      num += 1;
    });
    await Promise.all(fileCanAccessProcess);
    state.spec.replicas = replicas;
    const rs = crypto.randomBytes(20).toString('hex');
    state.spec.template.spec.containers[0].command[1] = `--NotebookApp.token=${rs}`;
    await k8sAppsApi.replaceNamespacedStatefulSet('jupyter-notebook', userNamespaceName, state);
    return rs;
  },
  async UserLogOut(username, replicas) {
    const Lowerusername = username.toLowerCase();
    const userNamespaceName = `${Lowerusername}-ai-platform`;
    const res = await k8sAppsApi.readNamespacedStatefulSet('jupyter-notebook', userNamespaceName);
    const state = res.body;
    state.spec.replicas = replicas;
    await k8sAppsApi.replaceNamespacedStatefulSet('jupyter-notebook', userNamespaceName, state);
  },

};

export default k8sSession;
