// import k8s from '@kubernetes/client-node';
// import crypto from 'crypto';
// import logger from '../libs/logger';

// // const cluster = {
// //   name: 'minikube',
// //   server: 'https://127.0.0.1:52236',
// //   caFile: '/Users/alice/.minikube/ca.crt',
// //   skipTLSVerify: false,
// // };

// // const user = {
// //   name: 'minikube',
// //   certFile: '/Users/alice/.minikube/ca.crt',
// //   keyFile: '/Users/alice/.minikube/ca.key',
// // };

// // const context = {
// //   name: 'minikube',
// //   user: 'minikube',
// //   cluster: 'minikube',
// // };

// const kc = new k8s.KubeConfig();
// kc.loadFromDefault();

// const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
// const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
// const k8sNetworkApi = kc.makeApiClient(k8s.NetworkingV1beta1Api);

// const Namespace = {
//   apiVersion: 'v1',
//   kind: 'Namespace',
//   metadata: {
//     name: '',
//   },
// };

// const PVC = {
//   apiVersion: 'v1',
//   kind: 'PersistentVolumeClaim',
//   metadata: {
//     name: 'jupyter-notebook-pvc',
//   },
//   spec: {
//     resources: {
//       requests: {
//         storage: '500Mi',
//       },
//     },
//     volumeMode: 'Filesystem',
//     storageClassName: 'standard',
//     accessModes: ['ReadWriteOnce'],
//   },
// };

// const stateful = {
//   apiVersion: 'apps/v1',
//   kind: 'StatefulSet',
//   metadata: {
//     name: 'jupyter-notebook',
//   },
//   spec: {
//     replicas: 0,
//     selector: {
//       matchLabels: {
//         app: 'jupyter-notebook',
//       },
//     },
//     serviceName: 'jupyter-notebook-svc',
//     template: {
//       metadata: {
//         labels: {
//           app: 'jupyter-notebook',
//         },
//       },
//       spec: {
//         containers: [
//           {
//             name: 'jupyter-notebook',
//             image: 'jupyter/tensorflow-notebook',
//             resources: {
//               requests: {
//                 memory: '64Mi',
//                 cpu: '250m',
//               },
//               limits: {
//                 memory: '128Mi',
//                 cpu: '500m',
//               },
//             },
//             command: [
//               'start-notebook.sh',
//               '--NotebookApp.token=test-token',
//               '--NotebookApp.base_url=/justin0u0/jupyter-notebook',
//               '--NotebookApp.tornado_settings=\'static_url_prefix=/justin0u0/jupyter-notebook/static\'',
//             ],
//             ports: [
//               {
//                 containerPort: 8888,
//               },
//             ],
//             volumeMounts: [
//               {
//                 mountPath: '/home/jovyan',
//                 name: 'jupyter-notebook-volume',
//               },
//             ],
//           },
//         ],
//         volumes: [
//           {
//             name: 'jupyter-notebook-volume',
//             persistentVolumeClaim: {
//               claimName: 'jupyter-notebook-pvc',
//             },
//           },
//         ],
//       },
//     },
//   },
// };

// const service = {
//   apiVersion: 'v1',
//   kind: 'Service',
//   metadata: {
//     name: 'jupyter-notebook-svc',
//   },
//   spec: {
//     type: 'NodePort',
//     selector: {
//       app: 'jupyter-notebook',
//     },
//     ports: [
//       {
//         port: 80,
//         targetPort: 8888,
//       },
//     ],
//   },
// };

// const ingress = {
//   apiVersion: 'networking.k8s.io/v1beta1',
//   kind: 'Ingress',
//   metadata: {
//     name: 'jupyter-notebook-ingress',
//   },
//   spec: {
//     ingressClassName: 'nginx',
//     rules: [
//       {
//         http: {
//           paths: [
//             {
//               path: '/justin0u0/jupyter-notebook',
//               pathType: 'Prefix',
//               backend: {
//                 serviceName: 'jupyter-notebook-svc',
//                 servicePort: 80,
//               },
//             },
//           ],
//         },
//       },
//     ],
//   },
// };

// const k8sCreate = {
//   async createNamespace(username) {
//     const Lowerusername = username.toLowerCase();
//     const newNamespace = `${Lowerusername}-ai-platform`;
//     Namespace.metadata.name = newNamespace;
//     k8sCoreApi.createNamespace(Namespace).then(
//       () => {
//         logger.info('Create Namespace Success');
//       },
//       (error) => {
//         logger.info(error);
//       },
//     );
//   },
//   async createPVC() {
//     k8sCoreApi.createNamespacedPersistentVolumeClaim(Namespace.metadata.name, PVC).then(
//       () => {
//         logger.info('Success to create PVC');
//       },
//       (error) => {
//         logger.info(error);
//       },
//     );
//   },
//   async createStatefuleset(username) {
//     stateful.spec.template.spec.containers[0].command[2] = `--NotebookApp.base_url=/${username}/jupyter-notebook`;
//     stateful.spec.template.spec.containers[0].command[3] = `--NotebookApp.tornado_settings='static_url_prefix=/${username}/jupyter-notebook/static'`;
//     k8sAppsApi.createNamespacedStatefulSet(Namespace.metadata.name, stateful).then(
//       () => {
//         logger.info('Success to create statefulset');
//       },
//       (error) => {
//         logger.info(error);
//       },
//     );
//   },
//   async createService() {
//     k8sCoreApi.createNamespacedService(Namespace.metadata.name, service).then(
//       () => {
//         logger.info('Success to create service');
//       },
//       (error) => {
//         logger.info(error);
//       },
//     );
//   },

//   async createIngress(username) {
//     const Lowerusername = username.toLowerCase();
//     ingress.spec.rules[0].http.paths[0].path = `/${Lowerusername}/jupyter-notebook`;
//     k8sNetworkApi.createNamespacedIngress(Namespace.metadata.name, ingress).then(
//       () => {
//         logger.info('Success to create ingress');
//       },
//       (error) => {
//         logger.info(error);
//       },
//     );
//   },
//   async UserLogIn(username, replicas) {
//     const Lowerusername = username.toLowerCase();
//     const userNamespaceName = `${Lowerusername}-ai-platform`;
//     const res = await k8sAppsApi.readNamespacedStatefulSet('jupyter-notebook', userNamespaceName);
//     const state = res.body;
//     state.spec.replicas = replicas;
//     const rs = crypto.randomBytes(20).toString('hex');
//     state.spec.template.spec.containers[0].command[1] = `--NotebookApp.token=${rs}`;
//     await k8sAppsApi.replaceNamespacedStatefulSet('jupyter-notebook', userNamespaceName, state);
//     return rs;
//   },
//   // async UserLogOut(username, replicas) {
//   //   const Lowerusername = username.toLowerCase();
//   //   const userNamespaceName = `${Lowerusername}-ai-platform`;
// //   const res = await k8sAppsApi.readNamespacedStatefulSet('jupyter-notebook', userNamespaceName);
//   //   const state = res.body;
//   //   state.spec.replicas = replicas;
//   //   await k8sAppsApi.replaceNamespacedStatefulSet('jupyter-notebook', userNamespaceName, state);
//   // },
// };

// export default k8sCreate;

import user from './user';
import session from './session';
import upload from './upload';
import tfserve from './tfserve';
import tensorboard from './tensorboard';

export default {
  user, session, upload, tfserve, tensorboard,
};
