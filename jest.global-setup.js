// Fixed timezone so DST-sensitive date tests are deterministic.
module.exports = async () => {
  process.env.TZ = 'Europe/Paris';
};
