import { print } from "kolmafia";

const log: string[] = [];

/**
 * Queues a message to be printed later when printLog() is called.
 * @param message - The message text to queue.
 */
export function logMessage(message: string): void {
  log.push(message);
}

/**
 * Prints all queued messages with the given color then clears the queue.
 * @param color - The color to use for printing messages.
 */
export function printLog(color: string): void {
  log.forEach((message) => print(message, color));
  log.length = 0;
}
