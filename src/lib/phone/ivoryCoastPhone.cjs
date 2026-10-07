"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IVORIAN_PHONE_REGEX = void 0;
exports.validateIvoryCoastPhone = validateIvoryCoastPhone;
exports.normalizeIvoryCoastPhone = normalizeIvoryCoastPhone;
exports.areEquivalentIvoryCoastPhones = areEquivalentIvoryCoastPhones;

exports.IVORIAN_PHONE_REGEX = /^(?:(?:\+225|00225)\s*)?(?:01|05|07)(?:[\s.-]?\d{2}){4}$/;

function validateIvoryCoastPhone(phone) {
    if (!phone || !phone.trim())
        return null;
    const normalized = normalizeIvoryCoastPhone(phone);
    if (!normalized) {
        return "Format de téléphone invalide. Ex: +225 07 07 38 15 63 ou 0707381563";
    }
    return null;
}

function normalizeIvoryCoastPhone(phone) {
    if (!phone || !phone.trim())
        return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits)
        return null;
    let national = digits;
    if (national.startsWith("225")) {
        national = national.slice(3);
    }
    else if (national.startsWith("00225")) {
        national = national.slice(5);
    }
    if (!/^(?:01|05|07)\d{8}$/.test(national)) {
        return null;
    }
    return "+225" + national;
}

function areEquivalentIvoryCoastPhones(phone1, phone2) {
    const normalized1 = normalizeIvoryCoastPhone(phone1);
    const normalized2 = normalizeIvoryCoastPhone(phone2);
    if (!normalized1 && !normalized2)
        return true;
    if (!normalized1 || !normalized2)
        return false;
    return normalized1 === normalized2;
}
