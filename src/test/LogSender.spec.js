const { logSender } = require('../../dist/lib/es5/index');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

// Mocking SQSClient e SendMessageCommand
jest.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: jest.fn(),
  SendMessageCommand: jest.fn()
}));

describe('LogSender', () => {

  beforeEach(() => {
    logSender.instance = null;
  });

  describe('configure', () => {
    it('should configure the client properly', () => {
      logSender.configure({
        region: process.env.AWS_REGION,
        queueUrl: process.env.QUEUE_URL,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      });
      expect(logSender).toBeInstanceOf(Object);
    });
  });

  describe('validateObjectLog', () => {
    it('should throw an error if required fields are missing', () => {
      expect(() => logSender.validateObjectLog({})).toThrow('Required fields missing from log');
    });

    it('should not throw an error if log is valid', () => {
      expect(() => logSender.validateObjectLog({ level: 'info' })).not.toThrow();
    });
  });

  describe('sendLog', () => {
    it('should send log success', async () => {
      logSender.configure({
        region: process.env.REGION,
        queueUrl: process.env.QUEUE_URL,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        application: 'ades',
      });
      const params = {
        message: "Example log 3",
        level: "INFO",
        action: "invoice created",
        host: "12.112.12.11",
        merchantId: "11",
        merchant: "john doe",
        tracerId: "-3331560295506262484",
        spanId: "-3331560295506262484"
      }

      const result = await logSender.sendLog(params);

      expect(result).toHaveProperty('MessageId');
      expect(result).toHaveProperty('MD5OfMessageBody');
    });
  });
});
