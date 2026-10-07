import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { Input } from '@mui/material';
import { styles } from '../styles';
import useClasses from '../useClasses';

const Compare = () => {
  const classes = useClasses(styles);
  const [priceByStockCode, setPriceByStockCode] = useState({});
  const [stockCodes, setStockCodes] = useState([]);

  const WORKSHEET_HEADERS = ['Stock Code (Max 30 Chars)', 'MOQ', 'Supplier Price', 'Customer Price'];

  const readFirstSheetRows = (binaryData) => {
    const workbook = XLSX.read(binaryData, { type: 'binary' });
    return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
  };

  const toDateValue = (rawDate) => {
    if (rawDate instanceof Date) {
      return new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
    }

    if (typeof rawDate === 'number') {
      const utcDays = Math.floor(rawDate - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate());
    }

    if (typeof rawDate === 'string') {
      const parsedDate = new Date(rawDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      }
    }

    return null;
  };

  const parseCustomerPriceList = (binaryData) => {
    const rows = readFirstSheetRows(binaryData);

    setPriceByStockCode((prev) => {
      const next = { ...prev };

      for (let i = 1; i < rows.length; i += 1) {
        const stockCode = rows[i]?.[0];
        const cpoDate = rows[i]?.[1];
        const moq = rows[i]?.[2];
        const price = rows[i]?.[3];
        const customerDate = toDateValue(cpoDate);

        if (!stockCode) {
          continue;
        }

        const existing = next[stockCode] || {};
        if (!existing.customer_date || (customerDate && customerDate > existing.customer_date)) {
          next[stockCode] = {
            ...existing,
            customer_date: customerDate,
            moq,
            customer_price: price,
          };
        }
      }

      return next;
    });
  };

  const parseSupplierPriceList = (binaryData) => {
    const rows = readFirstSheetRows(binaryData);

    setPriceByStockCode((prev) => {
      const next = { ...prev };

      for (let i = 1; i < rows.length; i += 1) {
        const receiveDate = rows[i]?.[0];
        const stockCode = rows[i]?.[1];
        const price = rows[i]?.[2];
        const normalizedReceiveDate = toDateValue(receiveDate);

        if (receiveDate === 'Forwarder :' || !stockCode) {
          continue;
        }

        const existing = next[stockCode] || {};
        if (!existing.receive_date || (normalizedReceiveDate && normalizedReceiveDate > existing.receive_date)) {
          next[stockCode] = {
            ...existing,
            receive_date: normalizedReceiveDate,
            supply_price: price,
          };
        }
      }

      return next;
    });
  };

  const parseStockList = (binaryData) => {
    const rows = readFirstSheetRows(binaryData);
    const nextStockCodes = [];

    for (let i = 1; i < rows.length; i += 1) {
      const stockCode = rows[i]?.[0];
      if (stockCode) {
        nextStockCodes.push(stockCode);
      }
    }

    setStockCodes(nextStockCodes);
  };

  const onFileChange = (event, fileNo) => {
    event.preventDefault();
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const binaryData = loadEvent.target?.result;
      if (typeof binaryData !== 'string') {
        return;
      }

      if (fileNo === 1) {
        parseStockList(binaryData);
      } else if (fileNo === 2) {
        parseCustomerPriceList(binaryData);
      } else {
        parseSupplierPriceList(binaryData);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadFile = () => {
    const workbookRows = stockCodes.map((stockCode) => {
      const data = priceByStockCode[stockCode];

      return {
        'Stock Code (Max 30 Chars)': stockCode,
        MOQ: data?.moq ?? '-',
        'Supplier Price': data?.supply_price ?? '-',
        'Customer Price': data?.customer_price ?? '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(workbookRows, { header: WORKSHEET_HEADERS });
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    FileSaver.saveAs(fileBlob, 'Data.xlsx');
  };

  return (
    <div className={classes.root}>
      <h1 className={classes.pageTitle}>Online Stock Pricing</h1>
      <p className={classes.pageLead}>Join the stock list with the latest customer and supplier prices.</p>
      <div className={classes.fileUploadContainer}>
        <div className={classes.fileUploadWrapper}>
          <span className={classes.label}>Stock List</span>
          <Input onChange={(event) => onFileChange(event, 1)} type="file" className={classes.fileUpload} />
        </div>
        <div className={classes.fileUploadWrapper}>
          <span className={classes.label}>Customer Price</span>
          <Input onChange={(event) => onFileChange(event, 2)} type="file" className={classes.fileUpload} />
        </div>
        <div className={classes.fileUploadWrapper}>
          <span className={classes.label}>Supplier Price</span>
          <Input onChange={(event) => onFileChange(event, 3)} type="file" className={classes.fileUpload} />
        </div>
      </div>
      <div className={classes.actionRow}>
        <button onClick={downloadFile} className={classes.download}>
          Download
        </button>
      </div>
    </div>
  );
};

export default Compare;