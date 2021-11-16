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

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworkApi = kc.makeApiClient(k8s.NetworkingV1beta1Api);

const Namespace = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'go-upload',
  },
};

const pod = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: 'go-uploader',
    labels: {
      name: 'go-uploader',
    },
  },
  spec: {
    containers: [
      {
        name: 'go-uploader',
        image: 'docker.io/justin0u0/go-uploader:v0.0.6-x86',
        imagePullPolicy: 'IfNotPresent',
        args: ['--token=test-token'],
        resources: {
          limits: {
            memory: '64Mi',
            cpu: '200m',
          },
          requests: {
            memory: '32Mi',
            cpu: '100m',
          },
        },
        ports: [
          {
            containerPort: 8181,
          },
        ],
        env: [
          {
            name: 'GIN_MODE',
            value: 'release',
          },
        ],
        volumeMounts: [
          {
            mountPath: '/app/upload',
            name: 'go-uploader-volume',
            subPath: 'test1',
          },
        ],
      },
    ],
    restartPolicy: 'OnFailure',
    volumes: [
      {
        name: 'go-uploader-volume',
        nfs: {
          path: '/var/k8s/_share',
          server: '10.121.240.237',
        },
      },
    ],
  },
};

const svc = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'go-uploader-svc',
  },
  spec: {
    selector: {
      name: 'go-uploader',
    },
    ports: [
      {
        port: 80,
        targetPort: 8181,
      },
    ],
  },
};

const ingress = {
  apiVersion: 'networking.k8s.io/v1beta1',
  kind: 'Ingress',
  metadata: {
    name: 'go-uploader-ingress',
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
          paths: [],
        },
      },
    ],
  },
};

const k8sUpload = {
  async createNamespace() {
    k8sCoreApi.createNamespace(Namespace).then(
      () => {
        logger.info('Create go-upload Namespace successfully');
      },
      (error) => {
        logger.info(error);
      },
    );
  },
  async createPod(req) {
    const auth = req.headers.authorization;
    const token = auth.slice(7);
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() < 10) ? `0${now.getMonth()}` : now.getMonth();
    const date = (now.getDate() < 10) ? `0${now.getDate()}` : now.getDate();
    const hour = (now.getHours() < 10) ? `0${now.getHours()}` : now.getHours();
    const min = (now.getMinutes() < 10) ? `0${now.getMinutes()}` : now.getMinutes();
    const sec = (now.getSeconds() < 10) ? `0${now.getSeconds()}` : now.getSeconds();
    pod.metadata.name = `go-uploader-${req.user.username.toLowerCase()}`;
    pod.metadata.labels.name = `go-uploader-${req.user.username.toLowerCase()}`;
    pod.spec.containers[0].volumeMounts[0].subPath = `${req.user.username.toLowerCase()}/${year}-${month}-${date}-${hour}${min}${sec}-${req.body.filename}`;
    pod.spec.containers[0].args[0] = `--token=${token}`;
    // logger.info(pod.spec.containers[0].volumeMounts[0].subPath);
    k8sCoreApi.createNamespacedPod('go-upload', pod).then(
      () => {
        logger.info('Success to create go-upload pod');
      },
      (error) => {
        logger.info(error);
      },
    );
    return pod.spec.containers[0].volumeMounts[0].subPath;
  },
  async createService(username) {
    svc.metadata.name = `go-uploader-svc-${username.toLowerCase()}`;
    svc.spec.selector.name = `go-uploader-${username.toLowerCase()}`;
    k8sCoreApi.createNamespacedService('go-upload', svc).then(
      () => {
        logger.info('Success to create go-upload service');
      },
      (error) => {
        logger.info(error);
      },
    );
  },
  async createIngress(username) {
    const httppath = {
      path: `/${username}/go-uploader(/|$)(.*)`,
      pathType: 'Prefix',
      backend: {
        serviceName: `go-uploader-svc-${username}`,
        servicePort: 80,
      },
    };
    k8sNetworkApi.readNamespacedIngressStatus('go-uploader-ingress', 'go-upload').then(
      () => {
        k8sNetworkApi.readNamespacedIngress('go-uploader-ingress', 'go-upload').then(
          (res) => {
            const newIngress = res.body;
            newIngress.spec.rules[0].http.paths.push(httppath);
            k8sNetworkApi.replaceNamespacedIngress('go-uploader-ingress', 'go-upload', newIngress).then(
              () => {
                logger.info('Replace go-upload ingress successfully');
              },
              (error) => {
                logger.info('Failed to replace go-upload ingress', error);
              },
            );
          },
          (error) => {
            logger.info(error);
          },
        );
      },
      () => {
        ingress.spec.rules[0].http.paths[0] = httppath;
        k8sNetworkApi.createNamespacedIngress('go-upload', ingress).then(
          () => {
            logger.info('create go-upload ingress successfully');
          },
          (error) => {
            logger.info(error);
          },
        );
      },
    );
  },
  async deletePod(username) {
    k8sCoreApi.deleteNamespacedPod(`go-uploader-${username.toLowerCase()}`, 'go-upload').then(
      () => {
        logger.info('Success to delete go-upload pod');
      },
      (error) => {
        logger.info(error);
      },
    );
  },
};

export default k8sUpload;
