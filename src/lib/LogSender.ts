import { config } from 'dotenv';
import  { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { hostname, platform } from 'os';
import chalk from 'chalk';

config();

interface Configure {
  region?: string;
  queueUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
  application?: string;
  host?: string;
  time?: string;
}

interface Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

class LogSender {
  static instance: LogSender;
  client: any;
  queueUrl: string;
  params: {};

  constructor() {
    if (LogSender.instance) {
      return LogSender.instance;
    }

    LogSender.instance = this;
    return this;
  }

  configure({
    region,
    queueUrl,
    accessKeyId,
    secretAccessKey,
    application,
    host,
    time
  }: Configure) {
    const config: Config = {
        accessKeyId: accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
        region: region || process.env.REGION
    };
    this.client = new SQSClient(config);
    this.queueUrl  = queueUrl;
    if (!host) {
      host = hostname();
    }
    if (!time) {
      time = new Date().toISOString();
    }
    if (!application) {
      application = platform();
    }
    const params = {
      application,
      host,
      time,
    }
    this.params = Object.keys(params).reduce((acc, key) => {
      if (params[key] !== null && params[key] !== '') {
        acc[key] = params[key];
      }
      return acc;
    }, {});
  }

  validateObjectLog(log: {}) {
    if (typeof log !== 'object') {
      throw new Error('Log must be an object');
    }
    const RequiredFields = ['level'];
    const isValid = RequiredFields.every(field => log.hasOwnProperty(field) && log[field] !== null && log[field] !== '');
    if (!isValid) {
      throw new Error('Required fields missing from log');
    }
  }

  printLog(print: any) {
    console.log(chalk.green('Log enviado com sucesso:'));
    console.log(chalk.yellow('Time: ') + print.time);
    console.log(chalk.blue('Level: ') + print.level);
    console.log(chalk.blue('Application: ') + print.application);

    for (const key in print) {
      if (['application', 'host', 'time'].includes(key)) continue;
      // se o campo for message muda a cor para vermelho
      if (key === 'message') {
        console.log(chalk.red(key + ': ') + print[key]);
      } else {
        console.log(chalk.magenta(key + ': ') + print[key]);
      }
    }
    console.log('\n'); // Linha em branco para separação
  }

  async sendLog(log: {}) {
    this.validateObjectLog(log);
    try {
      const params = {
        MessageBody: JSON.stringify({ ...this.params, ...log }),
        QueueUrl: this.queueUrl,
      };
      const command = new SendMessageCommand(params);
      const result = await this.client.send(command);

      const data = {
        ...result,
        logDetails: { ...this.params, ...log },
      }
      this.printLog({
        ...this.params,
        ...log,
        MD5OfMessageBodySQS: data.MD5OfMessageBody,
        messageIdSQS: data.MessageId,
      });
      return data;
    } catch (error) {
      console.error('Error send SQS: ', error);
    }
  }
}

export const logSender = new LogSender();
