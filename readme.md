# move-op

Implements [highly-available move operation for replicated trees](https://martin.kleppmann.com/papers/move-op.pdf).
The algorithm from the paper is cool because operations can be rewound. This is useful because operations must be applied in order and old operations must always be merged.

