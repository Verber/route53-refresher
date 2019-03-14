const fs = require('fs');
const AWS = require('aws-sdk');
const http = require('http');

let config;
if (fs.existsSync('./config.js')) {
    config = require('./config.js');
} else {
    config = require('./config.dist');
}

AWS.config.update({region: config.region});
const  route53 = new AWS.Route53();
const updateRecord = (zone, record, ip) => {
    let params = {
        "HostedZoneId": `/hostedzone/${zone}`, // our Id from the first call
        "ChangeBatch": {
            "Changes": [
                {
                    "Action": "UPSERT",
                    "ResourceRecordSet": {
                        "Name": record,
                        "Type": "A",
                        "TTL": 600,
                        "ResourceRecords": [
                            { "Value": ip }
                        ]
                    }
                }
            ]
        }
    };

    route53.changeResourceRecordSets(params, function(err,data) {
        console.log(err,data);
    });
}

console.log('Fetching public IP');

const reqOpts = {
    hostname: '169.254.169.254',
    path: '/latest/meta-data/public-ipv4',
    method: 'GET'
}
const req = http.request(reqOpts, (res) => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', (ip) => {
    console.log(`Public IP is ${ip}`);  
    updateRecord(config.zoneId, config.ARecord, ip.toString());
  });
});

req.on('error', (error) => {
    console.error(error)
});
  
req.end();


