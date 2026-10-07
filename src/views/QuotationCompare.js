import React, { useState } from 'react';
import { styles } from '../styles';
import useClasses from '../useClasses';
import { Backdrop, CircularProgress, Input } from '@mui/material';

const QuotationCompare = () => {
  const classes = useClasses(styles);
  const [loading, setLoading] = useState(false);
  const [newFile, setNewFile] = useState(null);
  const [oldFile, setOldFile] = useState(null);

  const uploadOld = (event) => {
    setOldFile(event.target.files?.[0] || null);
  };

  const uploadNew = (event) => {
    setNewFile(event.target.files?.[0] || null);
  };

  const getFilenameFromDisposition = (contentDisposition) => {
    if (!contentDisposition) {
      return 'output.xlsx';
    }

    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
    return filenameMatch?.[1] || 'output.xlsx';
  };

  const readErrorMessage = async (response) => {
    try {
      const payload = await response.json();
      return payload?.error || `Request failed with status ${response.status}`;
    } catch (error) {
      return `Request failed with status ${response.status}`;
    }
  };

  const postRequest = async () => {
    if (!oldFile || !newFile) {
      alert('Ensure both files are uploaded before proceeding.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file1', oldFile);
    formData.append('file2', newFile);

    try {
      const response = await fetch('https://worker.wiselinkapp.com/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        alert(`Error: ${message}`);
        return;
      }

      const filename = getFilenameFromDisposition(response.headers.get('Content-Disposition'));
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.root}>
      <h1 className={classes.pageTitle}>Update new Quotation file</h1>
      <ul className={classes.noteList}>
        <li>Quotation file type is an export from the system.</li>
        <li>The output follows the template of the new quotation.</li>
        <li>Details are copied from the old file when the CPN and MPN match.</li>
      </ul>
      <div className={classes.fileUploadContainer}>
        <div className={classes.fileUploadWrapper}>
          <span className={classes.label}>Old File</span>
          <Input onChange={uploadOld} type="file" className={classes.fileUpload} />
        </div>
        <div className={classes.fileUploadWrapper}>
          <span className={classes.label}>New File</span>
          <Input onChange={uploadNew} type="file" className={classes.fileUpload} />
        </div>
      </div>
      <div className={classes.actionRow}>
        <button onClick={postRequest} className={classes.download} disabled={loading}>
          Compile
        </button>
      </div>
      <Backdrop
        sx={{ color: '#dc831b', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" thickness={2.4} />
      </Backdrop>
    </div>
  );
};

export default QuotationCompare;