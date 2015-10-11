
# uplog, editable log on IPFS

Uplog is a wrapper around aolog, that extends it to allow versioning of the entries, i.e, updatable entries.

This is accomplished by appending entries with update annotations. 

```js
{ _updates: "#39",
  body: "new body" }
``` 

# API

Identical to aolog, with two additions:

## Uplog.update(idx, new_entry, cb)

cb: function (err, res)

Updates entry 'idx' and callbacks with the new log.

## Uplog.versions(idx) 

Returns a list of all versions of this entry, possibly only one.

# More info

For more info, check out the [aolog](https://github.com/krl/aolog) documentation.