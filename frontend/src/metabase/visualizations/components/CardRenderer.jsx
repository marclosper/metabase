/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import { Component, forwardRef } from "react";
import ReactDOM from "react-dom";

import ExplicitSize from "metabase/components/ExplicitSize";
import { isSameSeries } from "metabase/visualizations/lib/utils";

class CardRenderer extends Component {
  static propTypes = {
    className: PropTypes.string,
    series: PropTypes.array.isRequired,
    renderer: PropTypes.func.isRequired,
    onRenderError: PropTypes.func.isRequired,
    isEditing: PropTypes.bool,
    isDashboard: PropTypes.bool,
  };

  shouldComponentUpdate(nextProps) {
    // a chart only needs re-rendering when the result itself changes OR the chart type is different
    const sameSize =
      this.props.width === nextProps.width &&
      this.props.height === nextProps.height;
    const sameSeries = isSameSeries(this.props.series, nextProps.series);
    return !(sameSize && sameSeries);
  }

  componentDidMount() {
    this.renderChart();
  }

  componentDidUpdate() {
    this.renderChart();
  }

  componentWillUnmount() {
    this._deregisterChart();
  }

  _deregisterChart() {
    if (this._deregister) {
      // Prevents memory leak
      this._deregister();
      delete this._deregister;
    }
  }

  renderChart() {
    const { width, height } = this.props;
    if (width == null || height == null) {
      return;
    }

    const parent = ReactDOM.findDOMNode(this);

    // deregister previous chart:
    this._deregisterChart();

    // reset the DOM:
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }

    // create a new container element
    const element = document.createElement("div");
    parent.appendChild(element);

    try {
      this._deregister = this.props.renderer(element, this.props);
    } catch (err) {
      console.error(err);
      this.props.onRenderError(err.message || err);
    }
  }

  render() {
    return (
      <div
        className={this.props.className}
        style={this.props.style}
        ref={this.props.forwardedRef}
      />
    );
  }
}

const CardRendererWithRef = forwardRef(
  function _CardRendererWithRef(props, ref) {
    return <CardRenderer {...props} forwardedRef={ref} />;
  },
);

export default ExplicitSize({
  wrapped: true,
  // Avoid using debounce when isDashboard=true because there should not be any initial delay when rendering cards
  refreshMode: props => (props.isDashboard ? "debounceLeading" : "throttle"),
})(CardRendererWithRef);
