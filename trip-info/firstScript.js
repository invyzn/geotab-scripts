
const oneMonthAgo = () => {
    var d = (new Date());
    d.setMonth(d.getMonth() - 1);
    return (d.toISOString());

}
const convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [item[key]]: item,
        };
    }, initialValue);
};


const call = (method, params) => {
    return new Promise((resolve, reject) => {
        api.call(method, params, resolve, reject);
    })
}

const multiCall = (calls) => {
    return new Promise((resolve, reject) => {
        api.call("ExecuteMultiCall", {
            calls: calls
        }, resolve);
    })
}

const getDrivers = async () => {
    const drivers = await call("Get", {
        "typeName": "User",
        "resultsLimit": 10,
        "search": {
            "isDriver": true
        }
    });
    return convertArrayToObject(drivers, "id");
}

const getDriversTrips = async (drivers) => {
    const now = (new Date()).toISOString();
    const tripCalls = drivers.map(driver => ({
        "method": "Get",
        "params": {
            "typeName": "Trip",
            "resultsLimit": 10,
            "search": {
                "userSearch": {
                    "id": driver.id
                },
                "toDate": now,
                "fromDate": oneMonthAgo(),
                "includeOverlappedTrips": true
            }
        }
    }));
    return await multiCall(tripCalls);
};


const getAddresses = async (trips) => {
    const addressCalls = trips.map(driverTrip => ({
        "method": "GetAddresses",
        "params": {
            "coordinates": driverTrip.map((trip) => ({
                "x": trip.stopPoint.x,
                "y": trip.stopPoint.y
            })),
            "movingAddresses": false,
        }
    }))

    return await multiCall(addressCalls);
}

const getTripDevices = async (trips) => {
    const deviceIds = [];
    let device = trips.flat().map((trip) => trip.device.id);
    deviceIds.push(device);
    const deviceCalls = trips.map(driverTrip => ({
        "method": "Get",
        "params": {
            "typeName": "Device",
            "search": {
                "id": deviceIds.map[device]
            }
        }
    }))
    return await multiCall(deviceCalls);
}

const driverNamefromId = (drivers, id) => {
    return drivers[id] ? `${drivers[id].firstName} ${drivers[id].lastName}` : 'No driver'
};

const deviceNamefromId = (devices, id) => {
    for (let i = 0; i < devices.length; i++) {
        let ids = (devices[i].map(item => (item.id)));
        let names = (devices[i].map(item => (item.name)));
        for (let i = 0; i < ids.length; i++) {
            if (id === ids[i]) {
                return (names[i]);
            }
        }
        return 'device name not found';
    }
};

const formatTripDetails = (trips, drivers, devices, addresses) => {
    const details = [];
    trips.forEach((trip, index) => {
        let driverId = '';
        let deviceId = '';
        let formattedAddresses = [];
        let speed = 0;
        let distance = 0;
        let durations = [];
        
        trip.forEach((stop, stopIndex) => {
            let address = `(${addresses[index][stopIndex].formattedAddress})`;
            driverId = stop.driver.id;
            deviceId = stop.device.id;
            formattedAddresses.push(address);
            speed += stop.averageSpeed;
            distance += stop.distance;
            let startDate = new Date(stop.start)
            let stopDate = new Date(stop.stop)
            //time is wrong but work on it later
            let duration = new Date(((stopDate - startDate) / 1000 / 60) * 1000).toISOString().substr(11, 11)
            durations.push(duration);
        })

        speed /= trip.length;
        details.push({
            driverId: driverId,
            deviceId: deviceId,
            deviceName: deviceNamefromId(devices, deviceId),
            speed: speed,
            distance: distance,
            duration: durations.join(','),
            address: formattedAddresses.join(''),
            driverName: driverNamefromId(drivers, driverId)
        })

    });
    return details
}

const outputTripDetails = (tripDetails) => {
    tripDetails.forEach((details) => {
        console.log(details.driverName,
            `DriverId: ${details.driverId}`, `DeviceId: ${details.deviceId}`,
            `Device Name: ${details.deviceName}`, details.address,
            `${details.speed} km/h`, `${details.distance} km`, details.duration)
    })

}

const main = (async () => {
    const drivers = await getDrivers();
    const driversArray = Object.values(drivers);
    const trips = await getDriversTrips(driversArray);
    const addresses = await getAddresses(trips)
    const devices = await getTripDevices(trips)
    const tripDetails = formatTripDetails(trips, drivers, devices, addresses);
    
    outputTripDetails(tripDetails);
})();
