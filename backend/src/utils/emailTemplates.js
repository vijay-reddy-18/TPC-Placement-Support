const ticketCreatedTemplate = (name, ticketTitle, ticketId) => {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-bottom: 10px;">Placement Department</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px;">TPC Support System</p>

            <hr style="border: none; border-top: 2px solid #ecf0f1; margin: 20px 0;">

            <p style="color: #2c3e50; font-size: 16px;">Dear ${name},</p>

            <p style="color: #34495e; font-size: 14px; line-height: 1.6;">
                Your support ticket <strong>"${ticketTitle}"</strong> has been successfully created.
            </p>

            <p style="color: #34495e; font-size: 14px; line-height: 1.6;">
                Our Placement Department team has received your request and we will resolve your issue <strong>as soon as possible</strong>.
            </p>

            <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="color: #2c3e50; margin: 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
            </div>

            <p style="color: #34495e; font-size: 14px; line-height: 1.6;">
                Thank you for your patience. You can track your ticket status in your dashboard.
            </p>

            <hr style="border: none; border-top: 2px solid #ecf0f1; margin: 20px 0;">

            <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                Best Regards,<br>
                <strong>Placement Department</strong><br>
                TPC Support System
            </p>
        </div>
    </div>
    `;
};

const ticketSolvedTemplate = (name, ticketTitle, ticketId) => {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #27ae60; margin-bottom: 10px;">✓ Placement Department</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px;">TPC Support System</p>

            <hr style="border: none; border-top: 2px solid #ecf0f1; margin: 20px 0;">

            <p style="color: #27ae60; font-size: 18px; font-weight: bold;">Ticket Resolved</p>

            <p style="color: #2c3e50; font-size: 16px; margin-bottom: 10px;">Dear ${name},</p>

            <p style="color: #34495e; font-size: 14px; line-height: 1.6;">
                Your support ticket <strong>"${ticketTitle}"</strong> has been <strong style="color: #27ae60;">successfully resolved</strong>.
            </p>

            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
                <p style="color: #155724; margin: 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
                <p style="color: #155724; margin: 5px 0 0 0;"><strong>Status:</strong> Resolved</p>
            </div>

            <p style="color: #34495e; font-size: 14px; line-height: 1.6;">
                If you have any further concerns or would like to reopen this ticket, please feel free to contact us or create a new support ticket.
            </p>

            <hr style="border: none; border-top: 2px solid #ecf0f1; margin: 20px 0;">

            <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                Best Regards,<br>
                <strong>Placement Department</strong><br>
                TPC Support System
            </p>
        </div>
    </div>
    `;
};

const ticketUpdatedTemplate = (name, ticketTitle, ticketId, updates) => {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-bottom: 10px;">Placement Department</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px;">TPC Support System</p>

            <hr style="border: none; border-top: 2px solid #ecf0f1; margin: 20px 0;">

            <p style="color: #2c3e50; font-size: 16px;">Dear ${name},</p>

            <p style="color: #34495e; font-size: 14px; line-height: 1.6;">
                Your ticket <strong>"${ticketTitle}"</strong> has been updated.
            </p>

            <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="color: #2c3e50; margin: 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
                <p style="color: #2c3e50; margin: 5px 0 0 0;"><strong>Updates:</strong> ${updates}</p>
            </div>

            <p style="color: #34495e; font-size: 14px; line-height: 1.6;">
                Please log in to your dashboard to view more details about your ticket.
            </p>

            <hr style="border: none; border-top: 2px solid #ecf0f1; margin: 20px 0;">

            <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                Best Regards,<br>
                <strong>Placement Department</strong><br>
                TPC Support System
            </p>
        </div>
    </div>
    `;
};

module.exports = {
    ticketCreatedTemplate,
    ticketSolvedTemplate,
    ticketUpdatedTemplate,
};
