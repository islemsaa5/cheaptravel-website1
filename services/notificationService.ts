import { TravelPackage } from '../types';

export const notificationService = {
    /**
     * Real Email Broadcast
     * @param pkg The package to promote
     * @param recipients List of emails
     */
    sendBroadcastEmail: async (pkg: TravelPackage, recipients: string[]) => {
        console.log(`[Notification] Preparing broadcast for ${recipients.length} recipients`);

        if (recipients.length === 0) return { success: false, message: "Aucun destinataire." };

        // PRO APPROACH: Open default mail client with formatted body (Best for small-mid size agencies)
        const subject = encodeURIComponent(`Offre Exceptionnelle : ${pkg.title}`);
        const bodyText = `
Bonjour,

Découvrez notre nouvelle offre exclusive : ${pkg.title}

${pkg.description}

Prix à partir de : ${pkg.priceAdult || pkg.price} DA
Durée : ${pkg.duration}

Réservez dès maintenant sur : https://cheaptravel-dz.com

L'équipe Cheap Travel
    `;
        const body = encodeURIComponent(bodyText);

        // We use BCC for privacy
        const bccList = recipients.join(',');
        const mailtoUrl = `mailto:info@cheaptravel-dz.com?bcc=${bccList}&subject=${subject}&body=${body}`;

        // Try to open mail client
        window.location.href = mailtoUrl;

        return {
            success: true,
            method: 'MAILTO',
            message: `Client mail ouvert avec ${recipients.length} contacts en BCC.`
        };
    },

    /**
     * Real API Send using Resend
     */
    sendViaAPI: async (pkg: TravelPackage, recipients: string[], apiKey: string) => {
        console.log(`[Notification] Sending Direct API Broadcast to ${recipients.length} recipients...`);

        try {
            // We use the Resend API (Can be used from client if allowed by CORS, or proxy through edge function)
            // Note: In a real production app, this should be done via a backend function to protect the API Key.
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    from: 'Cheap Travel <onboarding@resend.dev>', // Replace with verified domain when ready
                    to: 'info@cheaptravel-dz.com', // Placeholder
                    bcc: recipients,
                    subject: `Offre Flash : ${pkg.title}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #1e3a8a;">Bonjour !</h2>
                            <p>Découvrez notre nouvelle offre exclusive : <strong>${pkg.title}</strong></p>
                            <img src="${pkg.image}" alt="${pkg.title}" style="width: 100%; border-radius: 10px; margin-bottom: 20px;">
                            <p>${pkg.description}</p>
                            <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; text-align: center;">
                                <p style="margin: 0; font-size: 14px; color: #666;">Prix à partir de</p>
                                <h3 style="margin: 10px 0; color: #f97316; font-size: 24px;">${(pkg.priceAdult || pkg.price).toLocaleString()} DA</h3>
                                <p style="margin: 0; font-weight: bold;">🌍 Durée : ${pkg.duration}</p>
                            </div>
                            <p style="text-align: center; margin-top: 30px;">
                                <a href="https://cheaptravel-dz.com" style="background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Réserver Maintenant</a>
                            </p>
                            <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
                            <p style="font-size: 10px; color: #999; text-align: center;">Cheap Travel Agency - Alger, Algérie</p>
                        </div>
                    `,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to send');
            }

            return { success: true, message: `${recipients.length} emails envoyés directement via API.` };
        } catch (err: any) {
            console.error("Resend API Fail:", err);
            return { success: false, message: err.message || "Erreur API Resend" };
        }
    },

    /**
     * Send Password Reset Email
     */
    sendResetEmail: async (email: string, resetLink: string, apiKey?: string) => {
        console.log(`[Notification] Sending Reset Link to ${email}...`);

        if (apiKey) {
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        from: 'Cheap Travel Security <security@cheaptravel-dz.com>',
                        to: email,
                        subject: `Réinitialisation de votre mot de passe`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 20px;">
                                <h1 style="color: #1e3a8a; font-size: 24px; text-align: center;">Récupération de compte</h1>
                                <p style="color: #666; font-size: 14px; line-height: 1.6;">Bonjour,</p>
                                <p style="color: #666; font-size: 14px; line-height: 1.6;">Vous avez demandé la réinitialisation de votre mot de passe pour votre portail Cheap Travel.</p>
                                <div style="text-align: center; margin: 40px 0;">
                                    <a href="${resetLink}" style="background: #1e3a8a; color: white; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px;">Réinitialiser mon mot de passe</a>
                                </div>
                                <p style="color: #999; font-size: 11px; text-align: center;">Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet email en toute sécurité.</p>
                                <hr style="border: none; border-top: 1px solid #f0f0f0; margin-top: 40px;">
                                <p style="font-size: 10px; color: #ccc; text-align: center;">Cheap Travel Agency &copy; 2026</p>
                            </div>
                        `,
                    }),
                });

                if (response.ok) return { success: true };
            } catch (err) {
                console.error("Critical: Email API failure", err);
            }
        }

        // FALLBACK: Local Simulation
        console.warn("[Notification] No API Key configured. Simulating email sending...");
        return { success: true, simulated: true };
    }
};
