const initPageSize = 20;
const cellStyle = {padding: 0, verticalAlign: 'center', textAlign: 'center',spacing: ' nowrap'};

function calcPageSize(tableSize) {
    return [20, 40, 60, {value: tableSize, label: 'All'}]

}

export default {calcPageSize, initPageSize,cellStyle}