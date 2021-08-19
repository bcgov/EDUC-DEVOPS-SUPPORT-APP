export function isValidDate(dob) {
  return (dob?.match(/\d{4}\/\d{2}\/\d{2}/g))
}

export function isValidGuid(guid) {
  return guid?.length === 32 || guid?.match(/[a-zA-Z0-9]{7}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{11}/g);
}
