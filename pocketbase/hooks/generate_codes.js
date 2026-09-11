// Hook: Auto-generate sequential codes for procedures (POP-xxx), audits (AUD-xxx), non_conformities (NC-xxx)
onRecordCreate(
  (e) => {
    const colName = e.record.collection().name
    let prefix = ''
    if (colName === 'procedures') {
      prefix = 'POP-'
    } else if (colName === 'audits') {
      prefix = 'AUD-'
    } else if (colName === 'non_conformities') {
      prefix = 'NC-'
    }

    const currentCode = e.record.getString('codigo')
    if (!currentCode || currentCode.trim() === '') {
      try {
        const records = $app.findRecordsByFilter(colName, '', '-codigo', 50, 0)
        let maxNum = 0
        for (let i = 0; i < records.length; i++) {
          const c = records[i].getString('codigo')
          if (c && c.startsWith(prefix)) {
            const numPart = parseInt(c.replace(prefix, ''), 10)
            if (!isNaN(numPart) && numPart > maxNum) {
              maxNum = numPart
            }
          }
        }
        const nextNum = maxNum + 1
        const formatted = prefix + String(nextNum).padStart(3, '0')
        e.record.set('codigo', formatted)
      } catch (err) {
        const fallback = prefix + String(Math.floor(Date.now() % 1000)).padStart(3, '0')
        e.record.set('codigo', fallback)
      }
    }

    e.next()
  },
  'procedures',
  'audits',
  'non_conformities',
)
