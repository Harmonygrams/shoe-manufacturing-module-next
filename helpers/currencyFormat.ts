export function formatCurrency(amount : number) {
    // Format the number with two decimal places and prefix it with 'Rs.'
    return 'Rs. ' + Number(amount).toFixed(2);
}
