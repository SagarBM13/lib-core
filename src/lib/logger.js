const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');

const config = {};
const logDir = './logs';
let transport;

let logger;
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}

const reload = () => {
	if (config.isEnable && config.type === 'aws') {
		const WinstonCloudWatch = require('winston-cloudwatch');
		const AWS = require('aws-sdk');
		AWS.config.update({
			region: config.providerConfig.region,
			accessKeyId: config.providerConfig.accessKeyId,
			secretAccessKey: config.providerConfig.secretKey
		});
		logger = winston.add(new WinstonCloudWatch({
			cloudWatchLogs: new AWS.CloudWatchLogs(),
			logGroupName: config.providerConfig.logGroupName,
			logStreamName: config.providerConfig.logStreamName,
			jsonMessage: true
		}));
	} else if (config.isEnable && config.type === 'google') {
		const { LoggingWinston } = require('@google-cloud/logging-winston');
		const loggingWinston = new LoggingWinston({
			projectId: config.providerConfig.project,
			keyFilename: config.providerConfig.keyFile,
			logName: config.providerConfig.logStreamName
		});
		logger = winston.createLogger({
			level: 'info',
			transports: [
				loggingWinston
			]
		});
	} else if (!logger) {
		const logFile = `./logs/${config.environment || 'log'}`;
		transport = new (winston.transports.DailyRotateFile)({
			filename: logFile,
			datePattern: 'YYYY-MM-DD',
			prepend: true,
			json: true,
			colorize: true,
			level: 'debug'
		});

		logger = winston.createLogger({
			transports: [
				transport
			]
		});
	}
};
module.exports.initialize = ({
	type, configurations, environment, isEnable, clsNameSpace
}) => {
	config.type = type;
	config.providerConfig = configurations;
	config.environment = environment;
	config.isEnable = isEnable;
	config.clsNameSpace = clsNameSpace;
	reload();
};

module.exports.getLogger = () => {
	if (!logger) {
		reload();
		return logger;
	}
	return logger;
};

module.exports.getConfig = () => config;
