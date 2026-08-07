---
title: Environment variables
description: Every environment variable the nschema CLI reads as a configuration override.
---

Environment values sit above configuration statements and below command-line flags in
[precedence](/cli/configuration/#precedence).

## Overriding a setting

**Any** setting on a `DATABASE` or `STATE` statement can be supplied from the environment, using its statement keyword
and its own name:

```
NSCHEMA_<KEYWORD>_<SETTING>
```

So `connection_string` on the `DATABASE` statement is `NSCHEMA_DATABASE_CONNECTION_STRING`, and `bucket` on the `STATE`
statement is `NSCHEMA_STATE_BUCKET`.

```sh
export NSCHEMA_DATABASE_CONNECTION_STRING="Host=localhost;Database=app;Username=postgres;Password=postgres"
```

## The rest

| Variable                            | Overrides                     | Notes                                                                                                               |
|-------------------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------------|
| `NSCHEMA_DESTRUCTIVE_ACTION_POLICY` | The destructive-action policy | `error` (default), `warn`, `allow`, or `ignore`. Equivalent to `--destructive-actions`.                             |
| `NSCHEMA_DATA_HAZARD_POLICY`        | The data-hazard policy        | `error`, `warn` (default), `allow`, or `ignore`. Equivalent to `--data-hazards`.                                    |
| `NSCHEMA_ENVIRONMENT`               | The target environment        | Selects the `*.env.<name>.sql` [overlay files](/cli/configuration/#environments). Equivalent to `--environment`.    |
| `NO_COLOR`                          | Colored output                | The well-known [`NO_COLOR`](https://no-color.org) convention; any value disables color. Equivalent to `--no-color`. |
