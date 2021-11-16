import k8s from '@kubernetes/client-node';
import logger from '../libs/logger';

const PORT = 8501;
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
    name: 'user-model-ingress',
    annotations: {
      'nginx.ingress.kubernetes.io/rewrite-target': '/$2',
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
              path: '/user/model(/|$)(.*)',
              pathType: 'Prefix',
              backend: {
                serviceName: 'user-model-service',
                servicePort: 8501,
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
    name: 'user-model-service',
    labels: {
      run: 'user-model-service',
    },
  },
  spec: {
    selector: {
      app: 'user-model',
    },
    ports: [
      {
        port: 8501,
        targetPort: 8501,
        name: 'restapi',
      },
    ],
  },
};

const deployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'user-model-deployment',
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'user-model',
      },
    },
    replicas: 1,
    template: {
      metadata: {
        labels: {
          app: 'user-model',
        },
      },
      spec: {
        containers: [
          {
            name: 'user-model',
            image: 'docker.io/user/image:latest',
            imagePullPolicy: 'Always',
            ports: [
              {
                containerPort: 8501,
                name: 'restapi',
              },
            ],
          },
        ],
        imagePullSecrets: [
          {
            name: '',
          },
        ],
      },
    },
  },
};

const k8sServe = {
  async createDeployment(username, modelname) {
    const ns = `${username}-ai-platform`;
    // sed -i "s/user-model/$user-$modelName/g" $user-$modelName/deployment.yaml
    deployment.metadata.name = `${username}-${modelname}-deployment`;
    deployment.spec.selector.matchLabels.app = `${username}-${modelname}`;
    deployment.spec.template.metadata.labels.app = `${username}-${modelname}`;
    deployment.spec.template.spec.containers[0].name = `${username}-${modelname}`;
    deployment.spec.template.spec.imagePullSecrets[0].name = `${username}-docker-secret`;

    // sed -i "s/docker.io.*/docker.io\/$DockerName\/$user-$modelName:latest/g" $user-$modelName/deployment.yaml
    deployment.spec.template.spec.containers[0].image = `docker.ai-platform.org/${username}/${username}-${modelname}:latest`;

    // sed -i "s/containerPort:.*/containerPort: $Port/g" $user-$modelName/deployment.yaml
    deployment.spec.template.spec.containers[0].ports[0].containerPort = PORT;
    k8sAppsApi.createNamespacedDeployment(ns, deployment).then(
      () => {
        logger.info('Success to create deployment');
      },
      (error) => {
        logger.info(error);
      },
    );
  },

  async createService(username, modelname) {
    // sed -i "s/user-model/$user-$modelName/g" $user-$modelName/service.yaml
    const ns = `${username}-ai-platform`;
    svc.metadata.labels.run = `${username}-${modelname}-service`;
    svc.metadata.name = `${username}-${modelname}-service`;
    svc.spec.selector.app = `${username}-${modelname}`;

    // sed -i "s/port:.*/port: $Port/g" $user-$modelName/service.yaml
    svc.spec.ports[0].port = PORT;

    // sed -i "s/targetPort:.*/targetPort: $Port/g" $user-$modelName/service.yaml
    svc.spec.ports[0].targetPort = PORT;
    k8sCoreApi.createNamespacedService(ns, svc).then(
      () => {
        logger.info('Success to create service');
      },
      (error) => {
        logger.info(error);
      },
    );
  },

  async createIngress(username, modelname) {
    // sed -i "s/user-model/$user-$modelName/g" $user-$modelName/ingress.yaml
    const ns = `${username}-ai-platform`;
    ingress.metadata.name = `${username}-${modelname}-ingress`;
    ingress.spec.rules[0].http.paths[0].backend.serviceName = `${username}-${modelname}-service`;

    // sed -i "s/servicePort:.*/servicePort: $Port/g" $user-$modelName/ingress.yaml
    ingress.spec.rules[0].http.paths[0].backend.servicePort = PORT;

    // sed -i "s/\/user\/model/\/$user\/$modelName/g" $user-$modelName/ingress.yaml
    ingress.spec.rules[0].http.paths[0].path = `/${username}/${modelname}(/|$)(.*)`;

    k8sNetworkApi.createNamespacedIngress(ns, ingress).then(
      () => {
        logger.info('Success to create ingress');
      },
      (error) => {
        logger.info(error);
      },
    );
    return `${DOMAIN}/${username}/${modelname}`;
  },
};

export default k8sServe;
