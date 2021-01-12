export function objectValues(obj: {[index: string]: any})
{
    return Object.keys(obj).map((value: string) => obj[value]);
}