#!/bin/sh

if [[ -z $SLAPD ]] ; then
  SLAPD=/usr/local/libexec/slapd
fi

if [[ -z $SLAPADD ]] ; then
  SLAPADD=/usr/local/sbin/slapadd
fi

if [[ -z $SLAPD_CONF ]] ; then
  SLAPD_CONF=slapd.conf
fi

MKDIR=/bin/mkdir
RM=/bin/rm
KILL=/bin/kill

$RM -rf openldap-data
$MKDIR openldap-data

if [[ -f slapd.pid ]] ; then
  $RM slapd.pid
fi

$SLAPADD -f $SLAPD_CONF < startup.ldif
$SLAPADD -f $SLAPD_CONF < sasl.ldif
$SLAPD -d0 -f $SLAPD_CONF -hldap://localhost:1234 &

if [[ ! -f slapd.pid ]] ; then
  sleep 1
fi

# slapd should be running now

# Make sure SASL is enabled
# ldapsearch -H ldap://localhost:1234 -x -b "" -s base supportedSASLMechanisms

node sasltest.js

$KILL $(cat slapd.pid)
