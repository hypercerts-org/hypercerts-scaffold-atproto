date time conversion issue:

```
Invalid activity record: Record/startDate must be an valid atproto datetime (both RFC-3339 and ISO-8601)
```

due to some date mismatching and conversions.

## partial data

Autofill usually tests with the full suite of data but it actually failed when the optional data was omitted. the display was mapping undefined values. ( Maybe this is more of a type issue, ts should've complained)
