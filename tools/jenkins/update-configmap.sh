envValue=$1
APP_NAME=$2
COMMON_NAMESPACE=$3
PEN_NAMESPACE=$4
APP_NAME_UPPER=${APP_NAME^^}

TZVALUE="America/Vancouver"
SOAM_KC_REALM_ID="master"
SOAM_KC=soam-$envValue.apps.silver.devops.gov.bc.ca
siteMinderLogoutUrl=""
if [ "$envValue" != "prod" ]; then
  siteMinderLogoutUrl="https://logontest7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl="
else
  siteMinderLogoutUrl="https://logon7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl="
fi
SOAM_KC_LOAD_USER_ADMIN=$(oc -n $COMMON_NAMESPACE-$envValue -o json get secret sso-admin-${envValue} | sed -n 's/.*"username": "\(.*\)"/\1/p' | base64 --decode)
SOAM_KC_LOAD_USER_PASS=$(oc -n $COMMON_NAMESPACE-$envValue -o json get secret sso-admin-${envValue} | sed -n 's/.*"password": "\(.*\)",/\1/p' | base64 --decode)
SPLUNK_TOKEN=$(oc -n $COMMON_NAMESPACE-$envValue -o json get configmaps ${APP_NAME}-${envValue}-setup-config | sed -n "s/.*\"SPLUNK_TOKEN_${APP_NAME_UPPER}\": \"\(.*\)\"/\1/p")

echo Fetching SOAM token
TKN=$(curl -s \
  -d "client_id=admin-cli" \
  -d "username=$SOAM_KC_LOAD_USER_ADMIN" \
  -d "password=$SOAM_KC_LOAD_USER_PASS" \
  -d "grant_type=password" \
  "https://$SOAM_KC/auth/realms/$SOAM_KC_REALM_ID/protocol/openid-connect/token" | jq -r '.access_token')

echo
echo Creating SAGA_DASHBOARD_ROLE role
curl -sX POST "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN" \
  -d "{\"name\" : \"SAGA_DASHBOARD_ROLE\",\"description\" : \"Allows access to devops saga dashboard\",\"composite\" : false,\"clientRole\" : false,\"containerId\" : \"$SOAM_KC_REALM_ID\"}"

echo
echo Retrieving client ID for dosa-soam
dosaClientID=$(curl -sX GET "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN" \
  | jq '.[] | select(.clientId=="dosa-soam")' | jq -r '.id')

echo
echo Retrieving client secret for dosa-soam
dosaClientSecret=$(curl -sX GET "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/clients/$dosaClientID/client-secret" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN" \
  | jq -r '.value')

SERVER_FRONTEND="dosa-$COMMON_NAMESPACE-$envValue.apps.silver.devops.gov.bc.ca"
if [ "$envValue" = "tools" ]; then
  SERVER_FRONTEND="dosa-$COMMON_NAMESPACE-dev.apps.silver.devops.gov.bc.ca"
elif [ "$envValue" = "dev" ]; then
  SERVER_FRONTEND="dosa-$COMMON_NAMESPACE-test.apps.silver.devops.gov.bc.ca"
elif [ "$envValue" = "test" ]; then
  SERVER_FRONTEND="dosa-$COMMON_NAMESPACE-uat.apps.silver.devops.gov.bc.ca"
fi

echo
echo Removing dosa-soam if exists
curl -sX DELETE "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/clients/$dosaClientID" \
  -H "Authorization: Bearer $TKN"

if [ "$dosaClientSecret" != "" ] && [ "$envValue" = "tools" ]; then
  echo
  echo Creating client dosa-soam with secret
  curl -sX POST "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/clients" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TKN" \
    -d "{ \"clientId\" : \"dosa-soam\",\"secret\" : \"dosaClientSecret\", \"name\" : \"Devops Support App SOAM\", \"description\" : \"DOSA admin user which logs into SOAM\", \"surrogateAuthRequired\" : false, \"enabled\" : true, \"clientAuthenticatorType\" : \"client-secret\", \"redirectUris\" : [ \"http://localhost*\", \"https://$SERVER_FRONTEND/api/auth/callback\",\"https://$SERVER_FRONTEND/logout\",\"https://$SERVER_FRONTEND/session-expired\" ], \"webOrigins\" : [ ], \"notBefore\" : 0, \"bearerOnly\" : false, \"consentRequired\" : false, \"standardFlowEnabled\" : true, \"implicitFlowEnabled\" : false, \"directAccessGrantsEnabled\" : false, \"serviceAccountsEnabled\" : true, \"publicClient\" : false, \"frontchannelLogout\" : false, \"protocol\" : \"openid-connect\", \"attributes\" : { \"saml.assertion.signature\" : \"false\", \"saml.multivalued.roles\" : \"false\", \"saml.force.post.binding\" : \"false\", \"saml.encrypt\" : \"false\", \"saml.server.signature\" : \"false\", \"saml.server.signature.keyinfo.ext\" : \"false\", \"exclude.session.state.from.auth.response\" : \"false\", \"saml_force_name_id_format\" : \"false\", \"saml.client.signature\" : \"false\", \"tls.client.certificate.bound.access.tokens\" : \"false\", \"saml.authnstatement\" : \"false\", \"display.on.consent.screen\" : \"false\", \"saml.onetimeuse.condition\" : \"false\" }, \"authenticationFlowBindingOverrides\" : { }, \"fullScopeAllowed\" : true, \"nodeReRegistrationTimeout\" : -1, \"protocolMappers\" : [ { \"name\" : \"IDIR Username\", \"protocol\" : \"openid-connect\", \"protocolMapper\" : \"oidc-usermodel-attribute-mapper\", \"consentRequired\" : false, \"config\" : { \"userinfo.token.claim\" : \"true\", \"user.attribute\" : \"idir_username\", \"id.token.claim\" : \"true\", \"access.token.claim\" : \"true\", \"claim.name\" : \"idir_username\", \"jsonType.label\" : \"String\" } }, { \"name\" : \"Display Name\", \"protocol\" : \"openid-connect\", \"protocolMapper\" : \"oidc-usermodel-attribute-mapper\", \"consentRequired\" : false, \"config\" : { \"userinfo.token.claim\" : \"true\", \"user.attribute\" : \"display_name\", \"id.token.claim\" : \"true\", \"access.token.claim\" : \"true\", \"claim.name\" : \"display_name\", \"jsonType.label\" : \"String\" } } ], \"defaultClientScopes\" : [ \"web-origins\", \"role_list\", \"profile\", \"roles\", \"email\", \"PEN_REQUEST_BATCH_READ_SAGA\", \"PEN_REQUEST_BATCH_WRITE_SAGA\", \"PEN_REPLICATION_READ_SAGA\", \"PEN_REPLICATION_WRITE_SAGA\", \"STUDENT_PROFILE_READ_SAGA\", \"STUDENT_PROFILE_WRITE_SAGA\"], \"optionalClientScopes\" : [ \"address\", \"phone\" ], \"access\" : { \"view\" : true, \"configure\" : true, \"manage\" : true } }"
else
  echo
  echo Creating client dosa-soam without secret
  curl -sX POST "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/clients" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TKN" \
    -d "{ \"clientId\" : \"dosa-soam\", \"name\" : \"Devops Support App SOAM\", \"description\" : \"DOSA admin user which logs into SOAM\", \"surrogateAuthRequired\" : false, \"enabled\" : true, \"clientAuthenticatorType\" : \"client-secret\", \"redirectUris\" : [ \"https://$SERVER_FRONTEND/api/auth/callback\",\"https://$SERVER_FRONTEND/logout\",\"https://$SERVER_FRONTEND/session-expired\" ], \"webOrigins\" : [ ], \"notBefore\" : 0, \"bearerOnly\" : false, \"consentRequired\" : false, \"standardFlowEnabled\" : true, \"implicitFlowEnabled\" : false, \"directAccessGrantsEnabled\" : false, \"serviceAccountsEnabled\" : true, \"publicClient\" : false, \"frontchannelLogout\" : false, \"protocol\" : \"openid-connect\", \"attributes\" : { \"saml.assertion.signature\" : \"false\", \"saml.multivalued.roles\" : \"false\", \"saml.force.post.binding\" : \"false\", \"saml.encrypt\" : \"false\", \"saml.server.signature\" : \"false\", \"saml.server.signature.keyinfo.ext\" : \"false\", \"exclude.session.state.from.auth.response\" : \"false\", \"saml_force_name_id_format\" : \"false\", \"saml.client.signature\" : \"false\", \"tls.client.certificate.bound.access.tokens\" : \"false\", \"saml.authnstatement\" : \"false\", \"display.on.consent.screen\" : \"false\", \"saml.onetimeuse.condition\" : \"false\" }, \"authenticationFlowBindingOverrides\" : { }, \"fullScopeAllowed\" : true, \"nodeReRegistrationTimeout\" : -1, \"protocolMappers\" : [ { \"name\" : \"IDIR Username\", \"protocol\" : \"openid-connect\", \"protocolMapper\" : \"oidc-usermodel-attribute-mapper\", \"consentRequired\" : false, \"config\" : { \"userinfo.token.claim\" : \"true\", \"user.attribute\" : \"idir_username\", \"id.token.claim\" : \"true\", \"access.token.claim\" : \"true\", \"claim.name\" : \"idir_username\", \"jsonType.label\" : \"String\" } }, { \"name\" : \"Display Name\", \"protocol\" : \"openid-connect\", \"protocolMapper\" : \"oidc-usermodel-attribute-mapper\", \"consentRequired\" : false, \"config\" : { \"userinfo.token.claim\" : \"true\", \"user.attribute\" : \"display_name\", \"id.token.claim\" : \"true\", \"access.token.claim\" : \"true\", \"claim.name\" : \"display_name\", \"jsonType.label\" : \"String\" } } ], \"defaultClientScopes\" : [ \"web-origins\", \"role_list\", \"profile\", \"roles\", \"email\", \"PEN_REQUEST_BATCH_READ_SAGA\", \"PEN_REQUEST_BATCH_WRITE_SAGA\", \"PEN_REPLICATION_READ_SAGA\", \"PEN_REPLICATION_WRITE_SAGA\", \"STUDENT_PROFILE_READ_SAGA\", \"STUDENT_PROFILE_WRITE_SAGA\"], \"optionalClientScopes\" : [ \"address\", \"phone\" ], \"access\" : { \"view\" : true, \"configure\" : true, \"manage\" : true } }"
fi

echo Fetching public key from SOAM
fullKey=$(curl -sX GET "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN" \
  | jq -r '.keys | .[] | select(has("publicKey")) | .publicKey')

soamFullPublicKey="-----BEGIN PUBLIC KEY----- $fullKey -----END PUBLIC KEY-----"
newline=$'\n'
formattedPublicKey="${soamFullPublicKey:0:26}${newline}${soamFullPublicKey:27:64}${newline}${soamFullPublicKey:91:64}${newline}${soamFullPublicKey:155:64}${newline}${soamFullPublicKey:219:64}${newline}${soamFullPublicKey:283:64}${newline}${soamFullPublicKey:347:64}${newline}${soamFullPublicKey:411:9}${newline}${soamFullPublicKey:420}"

###########################################################
#Setup for dosa-backend-config-map
###########################################################
echo
echo Retrieving client ID for dosa-soam
dosaClientID=$(curl -sX GET "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN" \
  | jq '.[] | select(.clientId=="dosa-soam")' | jq -r '.id')

echo
echo Retrieving client secret for dosa-soam
dosaClientSecret=$(curl -sX GET "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/clients/$dosaClientID/client-secret" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN" \
  | jq -r '.value')

echo Retrieving scope id for offline access
offlineAccessID=$(curl -sX GET "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/client-scopes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN" \
  | jq '.[] | select(.name=="offline_access")' | jq -r '.id')

echo
echo Updating client to include offline access scope
curl -sX PUT "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/clients/$dosaClientID/default-client-scopes/$offlineAccessID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN"

echo Generating private and public keys
ssh-keygen -b 4096 -t rsa -f tempDosaBackendkey -q -N ""
UI_PRIVATE_KEY_VAL="$(cat tempDosaBackendkey)"
UI_PUBLIC_KEY_VAL="$(ssh-keygen -f tempDosaBackendkey -e -m pem)"
echo Removing key files
rm tempDosaBackendkey
rm tempDosaBackendkey.pub

sessionMaxAge="1800000"
tokenExpiresIn="30m"
if [ "$envValue" == "test" ]; then
  sessionMaxAge="3600000"
  tokenExpiresIn="60m"
fi

if [ "$envValue" = "tools" ]; then
  BACKEND_ROOT=$APP_NAME-$COMMON_NAMESPACE-dev.apps.silver.devops.gov.bc.ca
elif [ "$envValue" = "dev" ]; then
  BACKEND_ROOT=$APP_NAME-$COMMON_NAMESPACE-test.apps.silver.devops.gov.bc.ca
elif [ "$envValue" = "test" ]; then
  BACKEND_ROOT=$APP_NAME-$COMMON_NAMESPACE-uat.apps.silver.devops.gov.bc.ca
else
  BACKEND_ROOT=$APP_NAME-$COMMON_NAMESPACE-$envValue.apps.silver.devops.gov.bc.ca
fi

echo Creating config map $APP_NAME-backend-config-map
oc create -n $COMMON_NAMESPACE-$envValue configmap $APP_NAME-backend-config-map --from-literal=SITEMINDER_LOGOUT_ENDPOINT="$siteMinderLogoutUrl" --from-literal=ID=$APP_NAME-soam --from-literal=SECRET=$dosaClientSecret --from-literal=SERVER_FRONTEND=https://$SERVER_FRONTEND --from-literal=ISSUER=DEVOPS_SUPPORT_APPLICATION --from-literal=SOAM_PUBLIC_KEY="$formattedPublicKey" --from-literal=DISCOVERY=https://$SOAM_KC/auth/realms/$SOAM_KC_REALM_ID/.well-known/openid-configuration --from-literal=KC_DOMAIN=https://$SOAM_KC/auth/realms/$SOAM_KC_REALM_ID --from-literal=LOG_LEVEL=info --from-literal=SESSION_MAX_AGE=$sessionMaxAge --from-literal=TOKEN_EXPIRES_IN=$tokenExpiresIn --from-literal=QUEUE_GROUP_NAME="dosa-node-queue-group" --from-literal=PEN_REQ_BATCH_API_URL=http://pen-reg-batch-api-master.$PEN_NAMESPACE-$envValue.svc.cluster.local:8080/api/v1/pen-request-batch-saga  --from-literal=STUDENT_PROFILE_API_URL=http://student-profile-saga-api-master.$PEN_NAMESPACE-$envValue.svc.cluster.local:8080/api/v1/student-profile-saga --from-literal=REPLICATION_API_URL=http://pen-replication-api-main.$PEN_NAMESPACE-$envValue.svc.cluster.local:8080/api/v1/pen-replication/saga --from-literal=SAGA_ADMIN_ROLE=SAGA_DASHBOARD_ROLE --dry-run -o yaml | oc apply -f -
echo
echo Setting environment variables for $APP_NAME-backend-main application
oc -n $COMMON_NAMESPACE-$envValue set env --from=configmap/$APP_NAME-backend-config-map dc/$APP_NAME-backend-main
###########################################################
#Setup for dosa-frontend-config-map
###########################################################
echo Creating config map $APP_NAME-frontend-config-map
oc create -n $COMMON_NAMESPACE-$envValue configmap $APP_NAME-frontend-config-map --from-literal=TZ=$TZVALUE --from-literal=HOST_ROUTE=$BACKEND_ROOT --from-literal=BACKEND_ROOT=https://$BACKEND_ROOT --dry-run -o yaml | oc apply -f -
echo
echo Setting environment variables for $APP_NAME-frontend-main application
oc -n $COMMON_NAMESPACE-$envValue set env --from=configmap/$APP_NAME-frontend-config-map dc/$APP_NAME-frontend-main

###########################################################
#Setup for dosa-flb-sc-config-map
###########################################################
SPLUNK_URL="gww.splunk.educ.gov.bc.ca"
FLB_CONFIG="[SERVICE]
   Flush        1
   Daemon       Off
   Log_Level    debug
   HTTP_Server   On
   HTTP_Listen   0.0.0.0
   Parsers_File parsers.conf
[INPUT]
   Name   tail
   Path   /mnt/log/*
   Exclude_Path *.gz,*.zip
   Parser docker
   Mem_Buf_Limit 20MB
[FILTER]
   Name record_modifier
   Match *
   Record hostname \${HOSTNAME}
[OUTPUT]
   Name   stdout
   Match  *
[OUTPUT]
   Name  splunk
   Match *
   Host  $SPLUNK_URL
   Port  443
   TLS         On
   TLS.Verify  Off
   Message_Key $APP_NAME
   Splunk_Token $SPLUNK_TOKEN
"
PARSER_CONFIG="
[PARSER]
    Name        docker
    Format      json
"
echo Creating config map $APP_NAME-flb-sc-config-map
oc create -n $COMMON_NAMESPACE-$envValue configmap $APP_NAME-flb-sc-config-map --from-literal=fluent-bit.conf="$FLB_CONFIG" --from-literal=parsers.conf="$PARSER_CONFIG" --dry-run -o yaml | oc apply -f -
