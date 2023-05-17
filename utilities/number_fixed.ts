export function number_fixed(number_value: number, number_length: number): string {
    const value_string  = number_value.toString();
    const value_minimum = Math.pow(10, number_length - 1);
    // over minimum
    if (number_value >= value_minimum) return value_string;
    return "0".repeat(number_length - value_string.length) + value_string;
}