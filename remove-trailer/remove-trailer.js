/* The following JavaScript example shows how to call Get and return a list of Devices. Note that it returns only the first 10 and the devices have to be active. */
const call = (method, params) => {
    return new Promise((resolve, reject) => {
        api.call(method, params, resolve, reject);
    })
}

const multicall  = (calls) => {
    return new Promise((resolve, reject) => {
        api.call("ExecuteMultiCall", {
            calls : calls
        }, resolve);
    }) 
}

const getTrailers = () => {
    return call("Get",{"typeName":"Trailer",
        "search":{}
    });
};

const getTrailersIds = (trailers) => {
    return trailers.map(trailer => trailer.id)
};

const removeTrailer = async (trailerIds) => {
    
    let calls = trailerIds.map(id => ({
        method : "Remove",
        params : {
            typeName : "Trailer",
            "entity":{"id":id}
        }
    }));

    
    return (await multicall(calls));
};

const removeAllTrailers = async (trailerIds) => {
    return await removeTrailer(trailerIds);
};


const main = async () => {
    try {
        const trailers = await getTrailers();
        const trailerIds = getTrailersIds(trailers);
        const removedTrailers = await removeAllTrailers(trailerIds);
        
        console.log(removedTrailers);
    } catch(err) {
        console.error(err.message);
    }
};


main();

               
              
