export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero'

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ]
  const b = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ]

  const convertBlock = (n: number) => {
    let str = ''
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred '
      n = n % 100
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' '
      n = n % 10
    }
    if (n > 0) {
      str += a[n]
    }
    return str
  }

  // Handle decimals (Paisa)
  const integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)

  let words = ''
  let n = integerPart

  if (n > 9999999) {
    words += convertBlock(Math.floor(n / 10000000)) + 'Crore '
    n = n % 10000000
  }
  if (n > 99999) {
    words += convertBlock(Math.floor(n / 100000)) + 'Lakh '
    n = n % 100000
  }
  if (n > 999) {
    words += convertBlock(Math.floor(n / 1000)) + 'Thousand '
    n = n % 1000
  }
  if (n > 0) {
    words += convertBlock(n)
  }

  words = words.trim()
  
  if (words !== '') {
    words = 'Rupees ' + words
  }

  if (decimalPart > 0) {
    words += ' and ' + convertBlock(decimalPart).trim() + ' Paisa'
  }

  return words + ' only'
}
