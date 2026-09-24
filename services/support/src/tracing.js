import {
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace
} from '@opentelemetry/api';

const tracer = trace.getTracer(
  'devassist-support',
  '0.1.0'
);

export function tracingMiddleware(req, res, next) {
  const parentContext = propagation.extract(
    context.active(),
    req.headers
  );

  const span = tracer.startSpan(
    `${req.method} ${req.path}`,
    {
      kind: SpanKind.SERVER,

      attributes: {
        'http.request.method': req.method,
        'url.path': req.path,
        'devassist.request.id': req.id ?? 'unknown'
      }
    },
    parentContext
  );

  const activeContext =
    trace.setSpan(parentContext, span);

  req.traceId =
    span.spanContext().traceId;

  res.setHeader(
    'x-trace-id',
    req.traceId
  );

  let ended = false;

  const endSpan = () => {
    if (ended) {
      return;
    }

    ended = true;

    span.setAttribute(
      'http.response.status_code',
      res.statusCode
    );

    if (res.statusCode >= 500) {
      span.setStatus({
        code: SpanStatusCode.ERROR
      });
    }

    span.end();
  };

  res.once('finish', endSpan);
  res.once('close', endSpan);

  context.with(
    activeContext,
    () => next()
  );
}

export function withSpan(
  name,
  attributes,
  operation
) {
  return tracer.startActiveSpan(
    name,
    {
      attributes
    },
    (span) => {
      try {
        return operation(span);
      } catch (error) {
        span.recordException(error);

        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });

        throw error;
      } finally {
        span.end();
      }
    }
  );
}