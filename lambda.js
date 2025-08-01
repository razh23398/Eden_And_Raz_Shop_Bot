// lambda.js -- הגרסה הסופית

// השירותים האלו יאותחלו פעם אחת כשה-Lambda "מתעוררת".
// זה חוסך זמן ריצה יקר.
const telegramService = require('./src/services/telegramService');
// אין צורך ב-sheetsService כאן ישירות, כי השירותים האחרים משתמשים בו.

/**
 * This is the main entry point for AWS Lambda.
 */
exports.handler = async (event) => {
    try {
        // המידע מטלגרם מגיע כ-string בתוך המאפיין 'body' של האירוע.
        const body = JSON.parse(event.body);
        console.log("Received update body:", body);

        // קוראים לפונקציה החדשה שיצרנו ומעבירים לה את כל המידע.
        await telegramService.processUpdate(body);

        // מחזירים תשובת 200 OK לטלגרם כדי שידע שקיבלנו את ההודעה.
        // זה חשוב כדי למנוע ממנו לשלוח את אותה הודעה שוב ושוב.
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Update processed successfully' }),
        };

    } catch (error) {
        console.error("Error in handler:", error);

        // גם במקרה של שגיאה, נחזיר 200 לטלגרם כדי שלא ינסה שוב.
        // את השגיאה עצמה נראה בלוגים של CloudWatch.
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Error processing update' }),
        };
    }
};