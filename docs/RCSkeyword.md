## blockRing keywords substitution

<!--
  $Keyword: value$
  $reserved: value$
-->

This file resides on the mfs file system at the location :
 $Source: /my/markdown/files/RCSkeywords.md$


All keywords are of the form $keyword: value$

  Keywords starting with a uppercase are User defined keywords

  {previous} is the "blockchain" keyword
  {parents} are the "VCS" keywords
  {qm,tic,spot} are the logging keywords

note:
  User defined keywords are (not) removed when stored
  keywords {previous} is (not) removed for ...
  keywords {parents} are (not) removed for ...

  keywords {qm, tic, spot} are removed for the payload hash computation...
  (by removed we mean we replace them with a static value)

### example

```
  $Source: /public/mychelium/docs/keywords.txt,v$
  $Date: now$
  $Author: michel$

  $mutable /my/etc/mutables/keywords.txt.log$

  # blockchain keywords:
  $previous: QmU1RDLsAGNPVuwDjKD3RQx7R6aEuQfcmSiubviDZ2XRVC$
  $next: unknown$

  # inheritance :
  $parents: QmRU26t5KP5QLiNbjWMxSbyfaARvzshfdzozj6M4K73auH$

  # logs :
  $qm: z2kVBvAEvFV2eFmoWDFifySwa4ZvaL4SpL8GeBgqgiXjyV8$
  $tic: 1579379089$
  $spot: 1550712774$

  $Signature: n/a$

```
