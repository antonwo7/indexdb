import { table, table_body, cars_select } from './../index_idb_promise.js'

export function idbCheckStores(db){
    if(db.objectStoreNames.length === 0){
        idbInitStores(db)
        return false
    }

    return true
}

export async function idbInitStores(db){
    await db.createObjectStore('Cars', { keyPath: 'id', autoIncrement: true });

    const driversStore = await db.createObjectStore('Drivers', { keyPath: 'id', autoIncrement: true });
    const car_id_index = await driversStore.createIndex('car_id_index', 'car_id');
}

export async function idbCheckItems(store, db){

    let transaction = db.transaction(store, 'readonly')
    let objectStore = transaction.objectStore(store)

    let filled = false

    try{
        let keys = await objectStore.getAllKeys();
        filled = !!keys && keys.length !== 0
    }catch(err){
        console.error('Ошибка при проверке записей')
    }

    return filled
}

export async function idbAddToStore(data, store, db){

    let transaction = db.transaction(store, 'readwrite')

    let list = transaction.objectStore(store)

    const idbAddItem = async function(object){
        try{
            await list.add(object)
        }catch(err){
            console.log("Ошибка добавления в хранилище " + store, err);
        }
    }

    if(Array.isArray(data)){
        data.forEach( async (item) => await idbAddItem(item) )
    }else if(typeof data === "object"){
        await idbAddItem(data)
    }

    await transaction.complete;
}

export async function idbInitItems(db){

    const cars = [
        { id: 1, name: 'Lada', speed: 150 },
        { id: 76, name: 'BMW', speed: 220 },
        { id: 3, name: 'VAZ', speed: 170 },
        { id: 34, name: 'UAZ', speed: 120 },
        { id: 19, name: 'KIA', speed: 180 },
        { id: 6, name: 'Renault', speed: 210 },
        { id: 80, name: 'Tesla', speed: 300 },
    ]

    const drivers = [
        { id: 1, name: 'Vasia', speed: 150, car_id: 76 },
        { id: 2, name: 'Zheka', speed: 220, car_id: 1 },
        { id: 3, name: 'Anton', speed: 170, car_id: 3 },
        { id: 4, name: 'Lenya', speed: 120, car_id: 34 },
        { id: 5, name: 'Denis', speed: 180, car_id: 34 },
        { id: 6, name: 'Arkasha', speed: 210, car_id: 76 },
        { id: 7, name: 'Vitek', speed: 300, car_id: 34 },
    ]

    await idbAddToStore(cars, 'Cars', db)
    await idbAddToStore(drivers, 'Drivers', db)
}

export async function idbInit(currentIDBName, currentIDBVersion){
    const db = await idb.openDB(currentIDBName, currentIDBVersion, {
        upgrade(db, oldVersion, newVersion, transaction) {

            if(idbCheckStores(db)){
                if(db.version > currentIDBVersion){
                    alert('Вы пытаетесь загрузить устаревшую базу данных')
                    return;
                }else if(db.version < currentIDBVersion){
                    // idbUpdate(db)
                }
            }
        },
        blocked() {
            // …
        },
        blocking() {
            // …
        },
        terminated() {
            // …
        },
    });


    const filled = await idbCheckItems('Cars', db)

    if(!filled){
        await idbInitItems(db)
    }

    return db
}

export async function findByIndex(index, store, db){

    let list = []

    try {
        let transaction = db.transaction(store); // readonly
        let objectStore = transaction.objectStore(store);
        let objectStoreIndex = await objectStore.index(index.name);

        let request = await objectStoreIndex.getAll(index.value)

        if(request && request.length){
            list = request
        }

    }catch(err){
        console.log("Нет таких записей")
    }

    return list
}

export async function getStoreItems(store, db){
    let transaction = db.transaction(store, 'readonly')
    let objectStore = transaction.objectStore(store)

    let storeList = []

    try {
        let cursor = await objectStore.openCursor();

        while (cursor) {
            const car = cursor.value
            storeList.push(car)
            cursor = await cursor.continue()
        }

    }catch(err){
        console.error('Ошибка при запросе данных с ' + store, err)
    }

    for(const item in storeList){
        const drivers = await findByIndex({ name: 'car_id_index', value: storeList[item].id }, 'Drivers', db)
        storeList[item] = { ...storeList[item], drivers: drivers }
    }

    return storeList
}

export async function carRender(db){

    const storeList = await getStoreItems('Cars', db)

    if(storeList){

        table_body.innerHTML = ''

        storeList.forEach( item => {

            const drivers = 'drivers' in item && Array.isArray(item.drivers) && item.drivers.length ? item.drivers.map(driver => driver.name).join(', ') : ''

            const item_content = `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.speed}</td>
                        <td>${drivers}</td>
                    </tr>`

            table_body.insertAdjacentHTML('beforeend', item_content)
        } )

        carSelectRender(storeList)
    }

}

export function carSelectRender(carsList){
    cars_select.innerHTML = ''
    carsList.forEach( car => cars_select.insertAdjacentHTML('beforeend', `<option value="${car.id}">${car.name}</option>`) )
}

export async function addDriverHandle(data, db){
    await idbAddToStore(data, 'Drivers', db)
    await carRender(db)
}