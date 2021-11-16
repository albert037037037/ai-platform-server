import k8s from '@kubernetes/client-node';
import logger from '../libs/logger';

const DOMAIN = 'ai-platform.org/user/model';

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
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworkApi = kc.makeApiClient(k8s.NetworkingV1beta1Api);

const ingress = {
  apiVersion: 'networking.k8s.io/v1beta1',
  kind: 'Ingress',
  metadata: {
    name: 'tensorboard-ingress',
    annotations: {
      'nginx.ingress.kubernetes.io/rewrite-target': '/$2',
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
              path: '/{user}/board/{run_name}(/|$)(.*)',
              pathType: 'Prefix',
              backend: {
                serviceName: 'tensorboard-svc',
                servicePort: 6006,
              },
            },
          ],
        },
      },
    ],
  },
};

const svc = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'tensorboard',
    labels: {
      app: 'tensorboard',
    },
  },
  spec: {
    ports: [
      {
        port: 6006,
        targetPort: 6006,
      },
    ],
    selector: {
      app: 'tensorboard',
    },
  },
};

const deployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'tensorboard',
    labels: {
      app: 'tensorboard',
    },
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'tensorboard',
      },
    },
    template: {
      metadata: {
        labels: {
          app: 'tensorboard',
        },
      },
      spec: {
        containers: [
          {
            name: 'tensorboard',
            image: 'kerwintsaiii/tensorboard',
            command: [
              'sh',
              '-c',
              'tensorboard --host 0.0.0.0 --logdir /tmp/artifact/save_model',
            ],
            ports: [
              {
                containerPort: 6006,
              },
            ],
            volumeMounts: [
              {
                name: 'tmp',
                mountPath: '/tmp/artifact',
              },
            ],
          },
        ],
        initContainers: [
          {
            name: 'init-logfile',
            image: 'kerwintsaiii/tensorboard',
            command: [
              'sh',
              '-c',
              'python3 /log/main.py --bucket_name mnist-jkgxuvkfui-0730100811 --log_dir save_model && mv /save_model /tmp/artifact',
            ],
            volumeMounts: [
              {
                name: 'tmp',
                mountPath: '/tmp/artifact',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'tmp',
            emptyDir: {},
          },
        ],
      },
    },
  },
};

const k8sTensorboard = {
  async createDeployment(username, bucketname, logdir) {
    const ns = `${username}-ai-platform`;
    deployment.spec.template.spec.initContainers[0].command[2] = `python3 /log/main.py --bucket_name ${bucketname} --log_dir ${logdir} && mv /${logdir} /tmp/artifact`;
    k8sAppsApi.createNamespacedDeployment(ns, deployment).then(
      () => {
        logger.info('Success to create deployment');
      },
      (error) => {
        logger.info(error);
      },
    );
  },

  async createService(username) {
    const ns = `${username}-ai-platform`;
    k8sCoreApi.createNamespacedService(ns, svc).then(
      () => {
        logger.info('Success to create service');
      },
      (error) => {
        logger.info(error);
      },
    );
  },

  async createIngress(username, runname) {
    const ns = `${username}-ai-platform`;
    ingress.spec.rules[0].http.paths[0].path = `/${username}/board/${runname}(/|$)(.*)`;
    k8sNetworkApi.createNamespacedIngress(ns, ingress).then(
      () => {
        logger.info('Success to create ingress');
      },
      (error) => {
        logger.info(error);
      },
    );
    return `${DOMAIN}/${username}/${runname}`;
  },
};

export default k8sTensorboard;
