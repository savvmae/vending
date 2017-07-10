const express = require('express');
const bodyParser = require('body-parser');
const data = require('./data.json');
const fs = require('file-system');
const moment = require('moment');
moment().format();
const application = express();
const filepath = require('./data.json');
application.use(bodyParser.json());

application.get('/api/customer/items', function (request, response) {
    return response.status(200).json(data.items);
});

application.get('/api/vendor/purchases', function (request, response) {
    return response.status(200).json(data.purchases);
});

application.get('/api/vendor/money', function (request, response) {
    return response.status(200).json(data.money);
});

application.post('/api/customer/items/:itemId/purchases', function (request, response) {
    var itemId = parseInt(request.params.itemId);
    var moneyReceived = parseInt(request.body.moneyReceived);
    var item = data.items.find(q => q.id === itemId);
    if(!item){
        var modelStatus = {
            status: "fail",
            data: "Item doesn't exist"
        }
        return response.status(200).json(modelStatus);
    }
    else if (item && item.quantity > 0) {
        if (item.cost > moneyReceived) {
            var modelStatus = {
                status: "fail",
                data: item.cost + " was just too expensive for your pockets, which managed to scrounge up " + moneyReceived
            }
            return response.status(200).json(modelStatus);
        } else if (item.cost === moneyReceived) {
            item.quantity -= 1;
            var purchase = {
                item_purchased: item.description,
                price: item.cost,
                date: moment().format("dddd, MMMM Do YYYY, h:mm a")
            }

            data.purchases.push(purchase);

            data.money += item.cost;

            var modelStatus = {
                status: "success",
                data: "collect your " + item.description + " from the bin!"
            }

            var itemsJSON = JSON.stringify(data);
            fs.writeFile('./data.json', itemsJSON, function (err) { });
            return response.status(200).json(modelStatus);

        } else if (moneyReceived > item.cost) {

            var change = moneyReceived - item.cost;
            item.quantity -= 1;

            var purchase = {
                item_purchased: item.description,
                price: item.cost,
                date: moment().format("dddd, MMMM Do YYYY, h:mm a")
            }

            data.purchases.push(purchase);

            data.money += item.cost;

            var modelStatus = {
                status: "success",
                data: "collect your " + item.description + " from the bin! Your change is " + change
            }

            var itemsJSON = JSON.stringify(data);
            fs.writeFile('./data.json', itemsJSON, function (err) { });
            return response.status(200).json(modelStatus);
        }

    } else {
        var modelStatus = {
            status: "fail",
            data: "Item is unavailable"
        }
        return response.status(200).json(modelStatus);
    }

});

application.post('/api/vendor/items', function (request, response) {
    var description = request.body.description;
    var cost = request.body.cost;
    var quantity = request.body.quantity;
    var newItem = {
        description: description,
        cost: cost,
        quantity: quantity,
        id: data.items.length + 1
    }
    // checks for legit data
    if (description && cost && quantity) {
        var addItem = data.items.push(newItem);
        var modelStatus = {
            status: "success",
            data: addItem
        }
        var itemsJSON = JSON.stringify(data);
        fs.writeFile('./data.json', itemsJSON, function (err) { });
        return response.status(200).json(modelStatus);
        // sends fail status if not legit data
    } else {
        var modelStatus = {
            status: "fail",
            data: newItem
        }
        return response.json(modelStatus);
    }
});

application.put('/api/vendor/items/:itemId', function (request, response) {
    var itemId = parseInt(request.params.itemId);
    var description = request.body.description;
    var cost = request.body.cost;
    var quantity = request.body.quantity;
    var updatedItem = {
        description: description,
        cost: cost,
        quantity: quantity,
        id: itemId
    }
    // checks for legit data and items existence
    var item = data.items.find(q => q.id === itemId);
    if (item && description && cost && quantity) {
        var updateItem = data.items.splice(data.items[item], 1, updatedItem);
        var modelStatus = {
            status: "success",
            data: updatedItem
        }
        var itemsJSON = JSON.stringify(data);
        fs.writeFile('./data.json', itemsJSON, function (err) { });
        response.json(modelStatus);
        // sends fail status if not legit data
    } else {
        var modelStatus = {
            status: "fail",
            data: updatedItem
        }
        response.json(modelStatus);
    }
});


application.listen(3000);

module.exports = application;