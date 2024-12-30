const AWS = require("aws-sdk");
let converter = require('json-2-csv');

const AWS_CONFIG = {
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    accessKeyId: "test",
    secretAccessKey: "test"
}

const dynamoDB = new AWS.DynamoDB(AWS_CONFIG);

function sendEmail(data) {
    var params = {
        Destination: {
            ToAddresses: [
                "a.s.arunvignesh@gmail.com"
            ],
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: data
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Test Report email",
            },
        },
        Source: "hello@example.com"
    };

    let sendPromise = new AWS.SES(AWS_CONFIG)
        .sendEmail(params)
        .promise();

    return sendPromise;
}

const exportNotesInEmail = () => {
    return new Promise((resolve, reject) => {

        const end_time = Date.now();
        const start_time = end_time - (5 * 60 * 1000);
        dynamoDB.scan({
            ExpressionAttributeValues: {
                ":start_time": {
                    N: start_time.toString()
                },
                ":end_time": {
                    N: end_time.toString()
                }
            },
            FilterExpression: "createdTime > :start_time AND createdTime < :end_time",
            TableName: "user_notes"
        }, async (err, data) => {
            if (err) {
                console.log(err)
                reject(err)
            }
            const result = data.Items.map(x => ({
                id: x.id.S,
                createdTime: x.createdTime.N,
                notes: x.notes.S
            }))
            const csv = await converter.json2csv(result, {});
            console.log(csv);
            const email_response = await sendEmail(csv);


            resolve({ result, email_response })
        })
    })
};
(async function () {
    console.log(await exportNotesInEmail());
})()
