import React from 'react';
import PropTypes from 'prop-types';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center">
            <div className="fixed inset-0 bg-black opacity-30"></div>
            <div className="bg-white rounded-lg p-4 z-10">
                <button
                    className="btn btn-sm rounded-md px-2 text-white hover:text-gray-300"
                    style={{ backgroundColor: '#0d6efd'}}
                    onClick={onClose}
                >
                    X
                </button>
                <div className="max-w-auto bg-white p-8 rounded shadow-md">
                    {children}
                </div>
            </div>
        </div>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
};

export default Modal;
