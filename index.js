const AWS = require("aws-sdk");
const app = require("express")();
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

app.use(require("body-parser").json())

app.get("/list", (req, res) => {
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
            throw new Error(err)
        }
        const result = data.Items.map(x => ({
            id: x.id.S,
            createdTime: x.createdTime.N,
            notes: x.notes.S
        }))
        const csv = await converter.json2csv(result, {});
        console.log(csv);
        const email_response = await sendEmail(csv);


        res.send({ result, email_response })
    })
})

app.post("/create", (req, res) => {
    req.body.id = Math.round(Math.random() * 100000)
    req.body.createdTime = Date.now();
    req.body.notes = req.body.notes || "";
    console.log(new Date(req.body.createdTime));
    dynamoDB.putItem({
        TableName: "user_notes",
        Item: {
            "id": {
                S: req.body.id.toString()
            },
            "notes": {
                S: req.body.notes
            },
            "createdTime": {
                N: req.body.createdTime.toString()
            }
        }
    }, (err, data) => {
        if (err) {
            console.log(err)
            throw new Error(err)
        }
        res.send(data)
    })
})

app.listen(8080);