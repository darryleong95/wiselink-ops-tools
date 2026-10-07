import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import * as FileSaver from 'file-saver'
import { Input } from '@mui/material'

import { styles } from '../styles'
import useClasses from '../useClasses'

const Compile = () => {

  const [fileA, setFileA] = useState({})
  const [fileB, setFileB] = useState({})

  const [q, setQs] = useState({})
  const [titleColumn, setTitleColumn] = useState("")

  const classes = useClasses(styles)

  const excelReader = (data, isFirstFile) => {
    let renderedData = XLSX.read(data, { type: 'binary' });
    const dataParse = XLSX.utils.sheet_to_json(renderedData.Sheets[renderedData.SheetNames[0]], { header: 1 });

    setTitleColumn(dataParse[0][0])

    for (let i = 1; i < dataParse[0].length; i++) {
      let key = parseInt(dataParse[0][i])
      if (!(key in q))
        q[key] = 1
    }

    setQs(q)

    let fileDict = {}

    for (let i = 1; i < dataParse.length; i++) {
      let partName = dataParse[i][0]

      let priceQuantity = {}
      for (let j = 1; j < dataParse[i].length; j++) {
        let quantity = parseInt(dataParse[0][j])
        let value = dataParse[i][j]
        priceQuantity[quantity] = value
      }

      fileDict[partName] = priceQuantity
    }

    delete fileDict[undefined]
    isFirstFile ? setFileA(fileDict) : setFileB(fileDict)
  }

  const onFileChange = (e, isFirstFile) => {
    e.preventDefault();
    var files = e.target.files, f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      excelReader(e.target.result, isFirstFile)
    };
    reader.readAsBinaryString(f)
  }

  const downloadFile = () => {
    // compare 2 files and take lowest value
    if (Object.keys(fileB).length !== 0) {
      let fileAKeys = Object.keys(fileA)
      let fileBKeys = Object.keys(fileB)
      let combined = fileAKeys.concat(fileBKeys)

      let uniqueItems = [...new Set(combined)]

      let quantities = Object.keys(q)

      for (let i = 0; i < uniqueItems.length; i++) {
        let individualItemPrice = {}
        /* Item does not exist in File A but exits in File B */
        if (fileA[uniqueItems[i]] === undefined) {
          for (let j = 0; j < quantities.length; j++) {
            individualItemPrice[quantities[j]] = fileB[uniqueItems[i]][quantities[j]]
          }
        }
        /* Item does not exist in File B but exits in File A */
        else if (fileB[uniqueItems[i]] === undefined) {
          for (let j = 0; j < quantities.length; j++) {
            individualItemPrice[quantities[j]] = fileA[uniqueItems[i]][quantities[j]]
          }
        }
        /* Item Exists in both */
        else {
          for (let j = 0; j < quantities.length; j++) {
            let A = fileA[uniqueItems[i]]
            let B = fileB[uniqueItems[i]]

            if (A[quantities[j]] === undefined) {
              individualItemPrice[quantities[j]] = B[quantities[j]]
            } else if (B[quantities[j]] === undefined) {
              individualItemPrice[quantities[j]] = A[quantities[j]]
            } else {
              individualItemPrice[quantities[j]] = A[quantities[j]] < B[quantities[j]] ? A[quantities[j]] : B[quantities[j]]
            }
          }
        }

        fileA[uniqueItems[i]] = individualItemPrice
      }
    }

    /* Write and Download File */
    let keys = Object.keys(fileA)
    let wbData = []

    let myHeader = ['MPN']

    let pl = fileA[keys[0]]
    for (let i = 0; i < Object.keys(pl).length; i++) {
      myHeader.push(Object.keys(pl)[i])
    }

    for (let i = 0; i < keys.length; i++) {
      let rowData = {}

      /* Part Name */
      rowData['MPN'] = keys[i]

      /* Quantity - Prices */
      let priceList = fileA[keys[i]]

      let quantityArr = Object.keys(priceList)
      let priceArr = Object.values(priceList)

      for (let j = 0; j < quantityArr.length; j++) {
        if (!isNaN(parseFloat(priceArr[j]))) {
          rowData[quantityArr[j]] = priceArr[j] * q[quantityArr[j]]
        }
      }
      wbData.push(rowData)
    }

    const ws = XLSX.utils.json_to_sheet(wbData, { header: myHeader })
    let wb = { Sheets: { 'data': ws }, SheetNames: ['data'] }
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dd = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(dd, 'Data.xlsx');
  }

  const updateMultiplier = (mult, value) => {
    let tmp = JSON.parse(JSON.stringify(q))
    if (mult.toString().length === 0) {
      tmp[value] = 1
      setQs(tmp)
    } else {
      tmp[value] = parseFloat(mult)
      setQs(tmp)
    }
  }


  return (
    <div className={classes.root}>
      <h1 className={classes.pageTitle}>Price Multiplier</h1>
      <p className={classes.pageLead}>Merge price sheets and apply a markup for each quantity.</p>
      <div className={classes.fileUploadContainer}>
        <div className={classes.fileUploadWrapper}>
          <span className={classes.label}>File 1</span>
          <Input onChange={(event) => onFileChange(event, true)} type="file" className={classes.fileUpload} />
        </div>
        <div className={classes.fileUploadWrapper}>
          <span className={classes.label}>File 2</span>
          <Input onChange={(event) => onFileChange(event, false)} type="file" disabled={Object.keys(fileA).length === 0} className={classes.fileUpload} />
        </div>
      </div>
      <section className={`${classes.fileUploadContainer} ${classes.stack}`}>
        <span className={classes.label}>
          Mark up value <span style={{ letterSpacing: '0', textTransform: 'none', color: '#76868b' }}> · numbers or decimals</span>
        </span>
        <div className={Object.keys(q).length !== 0 && classes.inputWrapper}>
          {
            Object.keys(q).map((value) => {
              return (
                <div key={value} className={classes.input}>
                  <label>
                    Q {value}
                  </label>
                  <input type="number" onChange={(e) => updateMultiplier(e.target.value, value)} value={q[value]} />
                </div>
              )
            })
          }
        </div>
        {
          Object.keys(q).length === 0 &&
          <p className={classes.hint}>Multiplier fields appear once a file is uploaded.</p>
        }
        <div className={classes.actionRow}>
          <button onClick={() => downloadFile()} className={classes.download} disabled={Object.keys(fileA).length === 0}>
            Download
          </button>
        </div>
      </section>
      <div className={classes.formatBlock}>
        <h3 className={classes.hint}>Price sheets need the layout below. The first cell is the part column, and the rest of the header row is quantities.</h3>
        <img alt="Sample Format" src={require('../assets/Format.png')} className={classes.formatImage} />
      </div>
    </div>
  );
}

export default Compile;
