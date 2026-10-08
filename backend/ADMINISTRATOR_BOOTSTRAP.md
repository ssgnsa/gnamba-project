# Administrator bootstrap

A fresh installation must provide `INITIAL_ADMIN_PASSWORD` through a protected
operational secret channel before the API creates the initial administrator. The
application fails closed if the account is absent and no bootstrap value is set.

After the administrator is created, remove `INITIAL_ADMIN_PASSWORD` from the
runtime environment and keep `AUTO_RESET_DEFAULT_ADMIN_PASSWORD=false`. Existing
accounts authenticate against their stored password hash and do not require the
bootstrap variable. Set the reset flag only for a deliberate, controlled recovery
that also supplies `INITIAL_ADMIN_PASSWORD`; turn it off immediately afterward.

Do not commit bootstrap credentials or place them in examples, logs, or build
artifacts.
