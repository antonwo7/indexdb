import * as fn from './functions/functions.js'

const currentIDBName = 'Garages'
const currentIDBVersion = 1

export const table = document.getElementById('cars')
export const table_body = table.querySelector('tbody')
export const cars_select = document.getElementById('car_select')
export const form = document.getElementById('form')
export const form_button = form.querySelector('button')

window.onload = async function(){

    const db = await fn.idbInit(currentIDBName, currentIDBVersion)

    form_button.addEventListener('click', () => {
        const name = form.querySelector('#name').value
        const car_id = cars_select.value

        fn.addDriverHandle({ name, car_id: +car_id }, db)
    })

    await fn.carRender(db)
}