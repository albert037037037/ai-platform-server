import k8s from '@kubernetes/client-node';
import logger from '../libs/logger';

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

// const kc = new k8s.KubeConfig();
// kc.loadFromDefault();

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworkApi = kc.makeApiClient(k8s.NetworkingV1beta1Api);

const Namespace = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: '',
  },
};

const PVC = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: {
    name: 'jupyter-notebook-pvc',
  },
  spec: {
    resources: {
      requests: {
        storage: '500Mi',
      },
    },
    volumeMode: 'Filesystem',
    storageClassName: 'nfs-client',
    accessModes: ['ReadWriteOnce'],
  },
};

const stateful = {
  apiVersion: 'apps/v1',
  kind: 'StatefulSet',
  metadata: {
    name: 'jupyter-notebook',
  },
  spec: {
    replicas: 0,
    selector: {
      matchLabels: {
        app: 'jupyter-notebook',
      },
    },
    serviceName: 'jupyter-notebook-svc',
    template: {
      metadata: {
        labels: {
          app: 'jupyter-notebook',
        },
      },
      spec: {
        containers: [
          {
            name: 'jupyter-notebook',
            image: 'jupyter/tensorflow-notebook',
            resources: {
              requests: {
                memory: '64Mi',
                cpu: '250m',
              },
              limits: {
                memory: '128Mi',
                cpu: '500m',
              },
            },
            command: [
              'start-notebook.sh',
              '--NotebookApp.token=test-token',
              '--NotebookApp.base_url=/justin0u0/jupyter-notebook',
              '--NotebookApp.tornado_settings=\'static_url_prefix=/justin0u0/jupyter-notebook/static\'',
              '--NotebookApp.allow_origin=\'*\'',
            ],
            ports: [
              {
                containerPort: 8888,
              },
            ],
            volumeMounts: [
              {
                mountPath: '/home/jovyan',
                name: 'jupyter-notebook-volume',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'jupyter-notebook-volume',
            persistentVolumeClaim: {
              claimName: 'jupyter-notebook-pvc',
            },
          },
        ],
      },
    },
  },
};

const service = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'jupyter-notebook-svc',
  },
  spec: {
    type: 'NodePort',
    selector: {
      app: 'jupyter-notebook',
    },
    ports: [
      {
        port: 80,
        targetPort: 8888,
      },
    ],
  },
};

const ingress = {
  apiVersion: 'networking.k8s.io/v1beta1',
  kind: 'Ingress',
  metadata: {
    name: 'jupyter-notebook-ingress',
    annotations: {
      'nginx.ingress.kubernetes.io/proxy-body-size': '10G',
      'nginx.ingress.kubernetes.io/client-max-body-size': '10G',
    },
  },
  spec: {
    ingressClassName: 'nginx',
    rules: [
      {
        host: 'ai-platform.org',
        http: {
          paths: [
            {
              path: '/justin0u0/jupyter-notebook',
              pathType: 'Prefix',
              backend: {
                serviceName: 'jupyter-notebook-svc',
                servicePort: 80,
              },
            },
          ],
        },
      },
    ],
  },
};

const secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  data: {
    '.dockerconfigjson': 'eyJhdXRocyI6eyJkb2NrZXIuYWktcGxhdGZvcm0ub3JnIjp7InVzZXJuYW1lIjoiYWRtaW4iLCJwYXNzd29yZCI6IjEyMzQ1NiIsImF1dGgiOiJZV1J0YVc0Nk1USXpORFUyIn19fQ==',
  },
  metadata: {
    name: 'regcred',
  },
  type: 'kubernetes.io/dockerconfigjson',
};

const k8sCreate = {
  async createNamespace(username) {
    const Lowerusername = username.toLowerCase();
    const newNamespace = `${Lowerusername}-ai-platform`;
    Namespace.metadata.name = newNamespace;
    k8sCoreApi.createNamespace(Namespace).then(
      () => {
        logger.info('Create jupyter namespace Success');
      },
      (error) => {
        logger.info(`create jupyter namespace error: ${error}`);
      },
    );
  },
  async createPVC() {
    k8sCoreApi.createNamespacedPersistentVolumeClaim(Namespace.metadata.name, PVC).then(
      () => {
        logger.info('Success to create jupyter namespace PVC');
      },
      (error) => {
        logger.info(`create jupyter namespace PVC error: ${error}`);
      },
    );
  },
  async createStatefuleset(username) {
    stateful.spec.template.spec.containers[0].command[2] = `--NotebookApp.base_url=/${username}/jupyter-notebook`;
    stateful.spec.template.spec.containers[0].command[3] = `--NotebookApp.tornado_settings='static_url_prefix=/${username}/jupyter-notebook/static'`;
    k8sAppsApi.createNamespacedStatefulSet(Namespace.metadata.name, stateful).then(
      () => {
        logger.info('Success to create jupyter namespace statefulset');
      },
      (error) => {
        logger.info(`create jupyter namespace statefulset error: ${error}`);
      },
    );
  },
  async createSecret(username) {
    secret.metadata.name = `${username}-docker-secret`;
    k8sCoreApi.createNamespacedSecret(Namespace.metadata.name, secret).then(
      () => {
        logger.info('Success to create jupyter namespace secret');
      },
      (error) => {
        logger.info(`create jupyter namespace secret error: ${error}`);
      },
    );
  },
  async createService() {
    k8sCoreApi.createNamespacedService(Namespace.metadata.name, service).then(
      () => {
        logger.info('Success to create jupyter namespace service');
      },
      (error) => {
        logger.info(`create jupyter namespace service error: ${error}`);
      },
    );
  },

  async createIngress(username) {
    const Lowerusername = username.toLowerCase();
    ingress.spec.rules[0].http.paths[0].path = `/${Lowerusername}/jupyter-notebook`;
    k8sNetworkApi.createNamespacedIngress(Namespace.metadata.name, ingress).then(
      () => {
        logger.info('Success to create jupyter namespace ingress');
      },
      (error) => {
        logger.info(`create jupyter namespace ingress error: ${error}`);
      },
    );
  },
  async checkJupyterStatus(username) {
    const Lowerusername = username.toLowerCase();
    let success = 1;
    let phase = '';
    await k8sCoreApi.readNamespacedPodStatus('jupyter-notebook-0', `${Lowerusername}-ai-platform`).then(
      (res) => {
        phase = res.response.body.status.phase;
      },
      (error) => {
        logger.info(`check namespace pod error: ${error}`);
        success = 0;
      },
    );
    if (success && phase === 'Running') {
      return 'Ready';
    }
    return 'Not Yet';
  },
};

export default k8sCreate;
