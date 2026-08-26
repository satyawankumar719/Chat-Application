import { Queue } from "bullmq";
import connection from "../config/ioRedis.js";
import { ENV } from "../config/envConfig.js";

const emailQueue = new Queue("email_queue", {
  connection,
});

export const addJobsQueue = async (
  to: string,
  subject: string,
  htmlContent: string,
  from: string = ENV.EMAIL_USER,
  
) => {
  const res = await emailQueue.add(`send_email_${to}`, {
    to,
    from,
    subject,
    html: htmlContent,
  });
  console.log(`Email job added into queue: ${res.id || res.name}`);
  return res;
};

export default emailQueue;
