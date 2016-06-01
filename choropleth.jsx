import { GeoJson, FeatureGroup } from 'react-leaflet'
import chroma from 'chroma-js'
import React, { Component, cloneElement, Children } from 'react'
import assign from './assign'

export default class Choropleth extends Component {

  isFunction (prop) {
    return typeof prop === 'function'
  }

  getColors() {
    const { data, valueProperty, mode, steps, scale, colors: cl } = this.props
    const colors = {}
    const features = Array.isArray(data) ? data : data.features

    const values = features.map(item => isFunction(valueProperty)
      ? valueProperty(item)
      : item.properties[valueProperty])

    colors.limits = chroma.limits(values, mode, steps - 1)
    colors.colors = cl || chroma.scale(scale).colors(steps)
    return colors
  }

  getStyle ({ limits, colors }, feature) {
    const { valueProperty, visible = (() => true), style: userStyle } = this.props

    if( !(( isFunction(visible) && visible(feature) ) || feature.properties[visible]) ) return userStyle

    const featureValue = isFunction(valueProperty)
      ? valueProperty(feature)
      : feature.properties[valueProperty]

    const idx = (!isNaN(featureValue))
      ? limits.findIndex(lim => featureValue <= lim)
      : -1

    if(colors[idx]){
      const style = {
        fillColor: colors[idx]
      }

      switch (typeof userStyle) {
        case 'function':
          return assign(userStyle(feature), style)
        case 'object':
          return assign({}, userStyle, style)
        default:
          return style
      }

    } else {
      return userStyle
    }

  }

  cloneChildrenWithFeature(props, feature){
    const newProps = assign({}, props, { feature })
    return Children.map(props.children, child => {
      return child ? cloneElement(child, newProps) : null
    })
  }

  render(){
    const features = Array.isArray(this.props.data) ? this.props.data : this.props.data.features
    const chroms = this.getColors()
    return (
      <FeatureGroup map={this.props.map} layerContainer={this.props.layerContainer} ref={ (layer) => layer ? this.leafletElement = layer.leafletElement : null } >
        {features.map( (feature, idx) =>
          (<GeoJson
            key={idx}
            {...this.props}
            style={this.getStyle(this.props, chroms, feature)}
            {...this.getStyle(chroms, feature)}
            data={feature}
            children={this.props.children ? this.cloneChildrenWithFeature(this.props, feature) : this.props.children}
          />)
        ) }
        </FeatureGroup>
    )
  }
}

